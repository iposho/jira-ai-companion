import { NextRequest } from 'next/server';
import { createServerClientFromCookies, createAdminClient } from '@/shared/api/supabase';
import { generatePlanningReport } from '@/features/reports/lib/planning-report';
import { generateDailyReport } from '@/features/reports/lib/daily-report';
import { generateWeeklyReport } from '@/features/reports/lib/weekly-report';
import { generateTimeReport } from '@/features/reports/lib/time-report';

export const dynamic = 'force-dynamic';

const reportGenerators: Record<string, (onProgress: (p: number, m: string) => void) => Promise<string>> = {
    planning: generatePlanningReport,
    daily: generateDailyReport,
    weekly: generateWeeklyReport,
    time: generateTimeReport,
};

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ type: string }> }
) {
    const { type } = await params;

    // Validate report type
    const generator = reportGenerators[type];
    if (!generator) {
        return new Response(JSON.stringify({ error: 'Invalid report type' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Check auth
    const supabase = await createServerClientFromCookies();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendProgress = (progress: number, message: string) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress, message })}\n\n`));
            };

            try {
                // Generate report
                const content = await generator(sendProgress);

                // Save to Supabase Storage
                const adminClient = createAdminClient();
                const date = new Date().toISOString().split('T')[0];
                const storagePath = `${user.id}/${type}/${date}.md`;

                const { error: uploadError } = await adminClient.storage
                    .from('reports')
                    .upload(storagePath, content, {
                        contentType: 'text/markdown',
                        upsert: true,
                    });

                if (uploadError) {
                    console.error('Storage upload error:', uploadError);
                }

                // Save metadata to DB
                const { error: dbError } = await adminClient.from('reports').insert({
                    user_id: user.id,
                    type,
                    title: getReportTitle(type),
                    storage_path: storagePath,
                    project_key: 'DEV',
                    created_at: new Date().toISOString(),
                });

                if (dbError) {
                    console.error('DB insert error:', dbError);
                }

                // Send final progress
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    progress: 100,
                    message: 'Готово',
                    storagePath,
                })}\n\n`));

            } catch (error) {
                console.error('Report generation error:', error);
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    error: error instanceof Error ? error.message : 'Unknown error',
                })}\n\n`));
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

function getReportTitle(type: string): string {
    const titles: Record<string, string> = {
        planning: 'Планирование',
        daily: 'Дейлик отчет',
        weekly: 'Недельный отчет',
        time: 'Отчет о времени',
    };
    return titles[type] || type;
}

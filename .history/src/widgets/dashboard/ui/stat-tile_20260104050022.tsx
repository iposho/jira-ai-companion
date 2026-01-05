import { pluralize } from "@/shared/lib/utils";

interface StatTileProps {
    count: number;
    label: [string, string, string];
    error?: boolean;
    href?: string;
}

export function StatTile({ count, label, error, href }: StatTileProps) {
    const content = (
        <div className={`relative overflow-hidden rounded-3xl p-8 
      bg-white/70 dark:bg-black/40 
      backdrop-blur-xl border border-white/20 dark:border-white/10
      shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]
      transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
      ${href ? 'group cursor-pointer' : ''}
    `}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 opacity-50" />

            <div className="relative z-10 flex flex-col items-start h-full justify-between min-h-[160px]">
                <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400 mb-4 transition-colors group-hover:text-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    <span className="font-medium text-sm uppercase tracking-wider opacity-80">
                        {label[1] === 'Неназначенные задачи' ? 'Не распределено' : 'Назначено нам'}
                    </span>
                </div>

                <div className="mt-auto">
                    <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        {error ? "-" : count}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        {pluralize(count, label)}
                    </p>
                </div>
            </div>
        </div>
    );

    if (href) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="block">
                {content}
            </a>
        );
    }

    return content;
}

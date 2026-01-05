import { LoginForm } from '@/features/auth/ui/login-form';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md">
                <div className="bg-white/70 dark:bg-black/40 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Jira AI Companion
                        </h1>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Войдите в систему
                        </p>
                    </div>

                    <LoginForm />
                </div>
            </div>
        </div>
    );
}

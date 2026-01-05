module.exports = {
    apps: [
        {
            name: 'jira-ai-companion',
            script: './scripts/start-prod.sh',
            interpreter: 'bash',
            cwd: './',
            instances: 1,
            exec_mode: 'fork',
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 5030,
            },
            env_development: {
                NODE_ENV: 'development',
                PORT: 3032,
            },
            env_staging: {
                NODE_ENV: 'production',
                PORT: 3031,
            },
            // Логирование
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            error_file: './logs/error.log',
            out_file: './logs/out.log',
            merge_logs: true,
            // Автоматический перезапуск
            autorestart: true,
            max_restarts: 10,
            restart_delay: 4000,
            // Graceful shutdown
            kill_timeout: 5000,
            wait_ready: true,
            listen_timeout: 10000,
        },
    ],
};

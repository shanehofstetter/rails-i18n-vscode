import { workspace } from "vscode";

export enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3
}

export let logLevel: LogLevel = workspace.getConfiguration('railsI18n').get('debugLevel');

export class Logger {
    public debug(...args): void {
        if (logLevel <= LogLevel.Debug) {
            console.info(...args);
        }
    }

    public info(...args): void {
        if (logLevel <= LogLevel.Info) {
            console.info(...args);
        }
    }

    public warn(...args): void {
        if (logLevel <= LogLevel.Warn) {
            console.warn(...args);
        }
    }

    public error(...args): void {
        if (logLevel <= LogLevel.Error) {
            console.error(...args);
        }
    }
}

export const logger = new Logger();

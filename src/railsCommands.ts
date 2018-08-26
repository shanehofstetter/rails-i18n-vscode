import { WorkspaceFolder, workspace } from "vscode";
import * as execa from "execa";
import { logger } from "./logger";

export class RailsCommands {
    public static getDefaultLocale(workspaceFolder: WorkspaceFolder): Promise<string> {
        return RailsCommands.callRails(['runner', 'puts "default_locale=#{I18n.default_locale}"'], workspaceFolder).then((result) => {
            const defaultLocale: string = result.split('=')[1].trim();
            logger.debug('default locale from rails:', defaultLocale, 'workspace dir:', workspaceFolder.name);
            if (defaultLocale) {
                return Promise.resolve(defaultLocale);
            }
            return Promise.reject();
        });
    }

    public static getLoadPaths(workspaceFolder: WorkspaceFolder): Promise<string[]> {
        return RailsCommands.callRails(['runner', 'I18n.load_path.each { |path| puts path }'], workspaceFolder).then((result) => {
            const translationFiles: string[] = result.split(/[\r\n]+/).filter(line => line.endsWith('.yml'));
            logger.debug('translation files: ', translationFiles);
            return Promise.resolve(translationFiles);
        });
    }

    private static getRailsCommand(): string[] {
        return workspace.getConfiguration('railsI18n').get<string>('pathToRails').split(/\s+/);
    }

    private static callRails(args: string[], workspaceFolder: WorkspaceFolder): Promise<string> {
        const railsCommand: string[] = RailsCommands.getRailsCommand();
        logger.debug('callRails', railsCommand, args, workspaceFolder);
        return execa(railsCommand.shift(), [...railsCommand, ...args], {
            cwd: workspaceFolder.uri.path
        }).then(result => {
            if (result.code === 0) {
                return Promise.resolve(result.stdout);
            }
            logger.warn('rails command returned error:', railsCommand, args, result.code, result.stderr);
            return Promise.reject(result.stderr);
        }, error => {
            logger.error('rails command failed:', error.message, 'workspace dir:', workspaceFolder.name);
            return Promise.reject(error.message);
        });
    }
}
import { WorkspaceFolder, workspace } from "vscode";
import * as execa from "execa";
import { logger } from "./logger";

export class RailsCommands {
    public static getDefaultLocale(workspaceFolder: WorkspaceFolder): Promise<string> {
        return RailsCommands.callRails(['runner', 'puts "default_locale=#{I18n.default_locale}"'], workspaceFolder).then((result) => {
            const defaultLocale: string = result.split('=')[1].trim();
            logger.debug('default locale from rails:', defaultLocale);
            if (defaultLocale && defaultLocale.length > 1) {
                return Promise.resolve(defaultLocale);
            }
            return Promise.reject();
        });
    }

    private static getRailsCommand(): string[] {
        return workspace.getConfiguration('railsI18n').get<string>('pathToRails').split(/\s+/);
    }

    private static callRails(args: string[], workspaceFolder: WorkspaceFolder): Promise<string> {
        const railsCommand: string[] = RailsCommands.getRailsCommand();
        logger.debug('callRails', railsCommand, args, workspace);
        return execa(railsCommand.shift(), [...railsCommand, ...args], {
            cwd: workspaceFolder.uri.path
        }).then(result => {
            if (result.code === 0) {
                return Promise.resolve(result.stdout);
            }
            logger.warn('rails command failed:', railsCommand, args, result.code, result.stderr);
            return Promise.reject(result.stderr);
        });
    }
}
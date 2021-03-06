type CommandFunctionType = () => Promise<unknown>;

export interface ICommands {
    [name: string]: CommandFunctionType;
}

/**
 * Слушает команды из коммандной строки и выполняет связанные действия.
 */
export default class CommandListener {

    /**
     * Набор команд
     */
    private readonly _commands: ICommands;

    constructor(commands: ICommands) {
        this._stdinDataHandler = this._stdinDataHandler.bind(this);
        this._commands = commands;
        process.stdout.write('command: ');
        process.stdin.on('data', this._stdinDataHandler);
    }

    /**
     * Хелпер для создания обработчиков команд. Оборачивает результат функции в промис
     */
    static createCommandFunction(func: Function): CommandFunctionType {
        return function (): Promise<unknown> {
            return Promise.resolve(func());
        };
    }

    /**
     * Обработчик появления команды на входе
     */
    private _stdinDataHandler(data: Buffer): void {
        process.stdin.removeListener('data', this._stdinDataHandler);
        const rawCommand = data.toString();
        const command = rawCommand.replace(/\W*/g, '');
        let commandPromise: Promise<unknown>;
        if (this._commands[command]) {
            commandPromise = this._commands[command]();
        } else {
            commandPromise = new Promise<unknown>((resolve) => {
                if (command) {
                    process.stdout.write(`Неизвестная команда: ${command}`);
                }
                resolve(undefined);
            });
        }
        commandPromise.then(() => {
            process.stdout.write('command: ');
            process.stdin.on('data', this._stdinDataHandler);
        });
    }
}
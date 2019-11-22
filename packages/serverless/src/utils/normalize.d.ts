import { BuildBuilderOptions } from './types';
export interface FileReplacement {
    replace: string;
    with: string;
}
export declare function normalizeBuildOptions<T extends BuildBuilderOptions>(options: T, root: string, sourceRoot: string): Promise<T>;

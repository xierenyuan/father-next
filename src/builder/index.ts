import path from 'path';
import { logger, rimraf } from '@umijs/utils';
import { normalizeUserConfig } from './config';
import bundle from './executor/bundle';
import bundless from './executor/bundless';
import type { ITransformer } from './protocol';
import type { IFatherConfig } from '../types';

const transformers: Record<string, ITransformer> = {};

/**
 * register bundless tranformer
 * @param transformer
 */
export function registerTransformer(transformer: ITransformer) {
  transformers[transformer.id] = transformer;
}

export default async (opts: { userConfig: IFatherConfig; cwd: string }) => {
  const configs = normalizeUserConfig(opts.userConfig, { cwd: opts.cwd });

  for (let config of configs) {
    // clean dist dir
    rimraf.sync(config.output!);

    switch (config.type) {
      case 'bundle':
        logger.info(
          `[bundle] from ${path.relative(
            opts.cwd,
            config.entry,
          )} to ${path.relative(opts.cwd, config.output!)}`,
        );
        await bundle(config);
        break;

      case 'bundless':
        const Transformer = transformers[config.transformer!];
        const transformer = new Transformer(config);

        logger.info(
          `[bundless] from ${path.relative(
            opts.cwd,
            config.input,
          )} to ${path.relative(opts.cwd, config.output!)}`,
        );
        await bundless(config, transformer);
        break;

      default:
    }
  }
};

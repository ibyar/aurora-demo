import { identity } from '../util/identity.js';
import { mapOneOrManyArgs } from '../util/mapOneOrManyArgs.js';
import { pipe } from '../util/pipe.js';
import { mergeMap } from './mergeMap.js';
import { toArray } from './toArray.js';
export function joinAllInternals(joinFn, project) {
    return pipe(toArray(), mergeMap(function (sources) { return joinFn(sources); }), project ? mapOneOrManyArgs(project) : identity);
}
//# joinAllInternals.js.map
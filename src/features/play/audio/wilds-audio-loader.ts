import { WILDS_AUDIO_ASSETS } from "./wilds-audio-catalog";
import type { WildsAudioAsset, WildsAudioAssetId, WildsAudioBankId } from "./wilds-audio-types";

export type WildsDecodedAudioBuffer = Readonly<{
  duration: number;
  length: number;
  numberOfChannels: number;
}>;

export type LoadedWildsAudio = Readonly<{
  asset: WildsAudioAsset;
  variantUrl: string;
  buffer: WildsDecodedAudioBuffer | null;
  stream: boolean;
}>;

type LoadedEntry = LoadedWildsAudio & {
  bytes: number;
  lastUsed: number;
};

export type WildsAudioLoaderOptions = Readonly<{
  assets?: readonly WildsAudioAsset[];
  fetchImpl?: typeof fetch;
  decode: (data: ArrayBuffer) => Promise<WildsDecodedAudioBuffer>;
  maxDecodedBytes?: number;
}>;

function estimatedDecodedBytes(buffer: WildsDecodedAudioBuffer) {
  return buffer.length * buffer.numberOfChannels * 4;
}

export function createWildsAudioLoader(options: WildsAudioLoaderOptions) {
  const assets = new Map((options.assets ?? WILDS_AUDIO_ASSETS).map((asset) => [asset.id, asset] as const));
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxDecodedBytes = options.maxDecodedBytes ?? 48 * 1024 * 1024;
  const loaded = new Map<WildsAudioAssetId, LoadedEntry>();
  const inFlight = new Map<WildsAudioAssetId, Promise<LoadedWildsAudio>>();
  const failures: WildsAudioAssetId[] = [];
  let sequence = 0;
  let disposed = false;

  const decodedBytes = () => [...loaded.values()].reduce((total, entry) => total + entry.bytes, 0);

  const evictToBudget = (protectedId?: WildsAudioAssetId) => {
    while (decodedBytes() > maxDecodedBytes) {
      const candidate = [...loaded.entries()]
        .filter(([id, entry]) => id !== protectedId && entry.bytes > 0)
        .sort((left, right) => left[1].lastUsed - right[1].lastUsed)[0];
      if (!candidate) break;
      loaded.delete(candidate[0]);
    }
  };

  const load = async (id: WildsAudioAssetId): Promise<LoadedWildsAudio> => {
    if (disposed) throw new Error("audio_loader_disposed");
    const cached = loaded.get(id);
    if (cached) {
      cached.lastUsed = ++sequence;
      return cached;
    }
    const pending = inFlight.get(id);
    if (pending) return pending;

    const request = (async () => {
      const asset = assets.get(id);
      if (!asset) throw new Error(`audio_asset_unknown:${id}`);
      const variant = asset.variants[0];
      if (!variant) throw new Error(`audio_asset_variant_missing:${id}`);

      try {
        if (asset.stream) {
          const entry: LoadedEntry = {
            asset,
            variantUrl: variant.url,
            buffer: null,
            stream: true,
            bytes: 0,
            lastUsed: ++sequence,
          };
          loaded.set(id, entry);
          return entry;
        }

        const response = await fetchImpl(variant.url);
        if (!response.ok) throw new Error(`http_${response.status}`);
        const buffer = await options.decode(await response.arrayBuffer());
        const entry: LoadedEntry = {
          asset,
          variantUrl: variant.url,
          buffer,
          stream: false,
          bytes: estimatedDecodedBytes(buffer),
          lastUsed: ++sequence,
        };
        loaded.set(id, entry);
        evictToBudget(id);
        return entry;
      } catch (error) {
        if (!failures.includes(id)) failures.push(id);
        const detail = error instanceof Error ? error.message : String(error);
        throw new Error(`audio_asset_load_failed:${id}:${detail}`);
      }
    })().finally(() => {
      inFlight.delete(id);
    });

    inFlight.set(id, request);
    return request;
  };

  return {
    load,
    async preloadBank(bank: WildsAudioBankId) {
      const matching = [...assets.values()].filter((entry) => entry.bank === bank);
      await Promise.all(matching.map((entry) => load(entry.id)));
    },
    retainBanks(banks: ReadonlySet<WildsAudioBankId>) {
      for (const [id, entry] of loaded) {
        if (!banks.has(entry.asset.bank)) loaded.delete(id);
      }
      evictToBudget();
    },
    snapshot() {
      return {
        decodedBytes: decodedBytes(),
        loadedAssetIds: [...loaded.keys()].sort(),
        failures: [...failures],
        inFlight: inFlight.size,
        disposed,
      };
    },
    dispose() {
      disposed = true;
      loaded.clear();
      inFlight.clear();
    },
  };
}

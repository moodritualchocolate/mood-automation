import type { CompositionPlan, ImageBrief, ImageResult } from '@/core/types';

export interface ImageProvider {
  name: string;
  generate(input: { brief: ImageBrief; composition: CompositionPlan }): Promise<ImageResult>;
}

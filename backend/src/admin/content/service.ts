// backend/src/admin/content/service.ts
// Business logic cho admin content CRUD + revision tracking.

import { prisma } from '../../db';
import type { ContentItem, ContentItemRevision, ContentVoice, ContentModule } from '@prisma/client';

export interface ListFilter {
  module?: ContentModule;
  dayNumber?: number;
  voice?: ContentVoice;
  search?: string;       // full-text title + body
  published?: 'all' | 'true' | 'false';
  hasTargeting?: 'all' | 'yes' | 'no';
}

export async function listContent(filter: ListFilter = {}): Promise<{ items: any[]; total: number }> {
  const where: any = {};
  if (filter.module) where.module = filter.module;
  if (filter.dayNumber !== undefined) where.dayNumber = filter.dayNumber;
  if (filter.voice) where.voice = filter.voice;
  if (filter.published === 'true') where.published = true;
  if (filter.published === 'false') where.published = false;
  if (filter.hasTargeting === 'yes') where.targetRules = { not: null };
  if (filter.hasTargeting === 'no') where.targetRules = null;
  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: 'insensitive' } },
      { body: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  const items = await prisma.contentItem.findMany({
    where,
    orderBy: [{ dayNumber: 'asc' }, { module: 'asc' }, { priority: 'desc' }],
    include: {
      _count: { select: { revisions: true } },
    },
  });

  return {
    total: items.length,
    items: items.map((item) => ({
      id: item.id,
      dayNumber: item.dayNumber,
      module: item.module,
      title: item.title,
      body: item.body,
      voice: item.voice,
      priority: item.priority,
      targetRules: item.targetRules,
      published: item.published,
      wikiUrl: item.wikiUrl,
      ctaAction: (item as any).ctaAction ?? null,
      pushTime: item.pushTime,
      exerciseKey: item.exerciseKey,
      moment: (item as any).moment ?? null,
      lastEditedBy: item.lastEditedBy,
      updatedAt: item.updatedAt,
      revisionCount: (item as any)._count.revisions,
    })),
  };
}

export async function getOne(id: string): Promise<ContentItem | null> {
  return prisma.contentItem.findUnique({ where: { id } });
}

export interface UpdatePayload {
  title?: string;
  body?: string;
  voice?: ContentVoice;
  priority?: number;
  targetRules?: any;     // Json — frontend gửi object, prisma accept
  published?: boolean;
  wikiUrl?: string | null;
  moment?: 'COFFEE_MORNING' | 'TEA_AFTERNOON' | 'POST_LUNCH' | 'POST_DINNER' | 'PRE_SOCIAL_DRINK' | 'PRE_BEDTIME' | 'GENERIC' | null;
  changeNote?: string;
}

/**
 * Update content item, đồng thời tạo revision snapshot trước khi update.
 */
export async function updateContent(
  id: string,
  patch: UpdatePayload,
  editedBy: string,
): Promise<ContentItem> {
  const current = await prisma.contentItem.findUnique({ where: { id } });
  if (!current) throw new Error('Content item not found');

  // Tạo revision trước khi update
  const lastRev = await prisma.contentItemRevision.findFirst({
    where: { contentItemId: id },
    orderBy: { versionNum: 'desc' },
  });
  const nextVersion = (lastRev?.versionNum ?? 0) + 1;

  await prisma.contentItemRevision.create({
    data: {
      contentItemId: id,
      versionNum: nextVersion,
      title: current.title,
      body: current.body,
      voice: current.voice,
      targetRules: current.targetRules ?? undefined,
      priority: current.priority,
      editedBy,
      changeNote: patch.changeNote,
    },
  });

  // Update với patch
  const updated = await prisma.contentItem.update({
    where: { id },
    data: {
      title: patch.title ?? current.title,
      body: patch.body ?? current.body,
      voice: patch.voice ?? current.voice,
      priority: patch.priority ?? current.priority,
      targetRules: patch.targetRules !== undefined ? patch.targetRules : (current.targetRules ?? undefined),
      published: patch.published ?? current.published,
      wikiUrl: patch.wikiUrl !== undefined ? patch.wikiUrl : current.wikiUrl,
      moment: patch.moment !== undefined ? (patch.moment as any) : current.moment,
      lastEditedBy: editedBy,
    },
  });

  return updated;
}

export async function listRevisions(contentItemId: string): Promise<ContentItemRevision[]> {
  return prisma.contentItemRevision.findMany({
    where: { contentItemId },
    orderBy: { versionNum: 'desc' },
  });
}

/**
 * Restore content item về 1 revision cũ. Tạo revision mới (snapshot current state) trước.
 */
export async function restoreRevision(
  contentItemId: string,
  versionNum: number,
  editedBy: string,
): Promise<ContentItem> {
  const target = await prisma.contentItemRevision.findFirst({
    where: { contentItemId, versionNum },
  });
  if (!target) throw new Error('Revision not found');

  // Update sẽ tự tạo new revision của current state
  return updateContent(
    contentItemId,
    {
      title: target.title,
      body: target.body,
      voice: target.voice,
      priority: target.priority,
      targetRules: target.targetRules ?? null,
      changeNote: `Restore từ v${versionNum}`,
    },
    editedBy,
  );
}

export interface CreatePayload {
  dayNumber: number;
  module: ContentModule;
  title: string;
  body: string;
  voice?: ContentVoice;
  priority?: number;
  targetRules?: any;
  wikiUrl?: string;
  ctaAction?: string;
  pushTime?: string;
  exerciseKey?: string;
  published?: boolean;
}

export async function createContent(payload: CreatePayload, createdBy: string): Promise<ContentItem> {
  return prisma.contentItem.create({
    data: {
      dayNumber: payload.dayNumber,
      module: payload.module,
      title: payload.title,
      body: payload.body,
      voice: payload.voice ?? 'SOL_DONG_HANH',
      priority: payload.priority ?? 100,
      targetRules: payload.targetRules,
      wikiUrl: payload.wikiUrl,
      pushTime: payload.pushTime,
      exerciseKey: payload.exerciseKey,
      published: payload.published ?? true,
      lastEditedBy: createdBy,
    },
  });
}

export async function deleteContent(id: string): Promise<void> {
  await prisma.contentItem.delete({ where: { id } });
}

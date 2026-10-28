import "server-only";
import { db } from "@/lib/db";
import { updateTag, CACHE_TAGS } from "@/components/cacheTag";
import {
  type SmsTemplate,
  type TemplateTriggerEvent,
  type TemplateLanguage,
  type TemplateContext,
  DEFAULT_TEMPLATES,
  AVAILABLE_PLACEHOLDERS,
  renderSmsTemplate,
} from "./templates-shared";

export {
  type SmsTemplate,
  type TemplateTriggerEvent,
  type TemplateLanguage,
  type TemplateContext,
  DEFAULT_TEMPLATES,
  AVAILABLE_PLACEHOLDERS,
  renderSmsTemplate,
};

function getTemplateModel() {
  const model = (db.orm?.public as any)?.SmsTemplate;
  return model ?? null;
}

/**
 * Ensures the database contains all standard templates on initial load.
 */
export async function seedDefaultTemplatesIfEmpty(): Promise<void> {
  try {
    const model = getTemplateModel();
    if (!model) {
      console.warn("db.orm.public.SmsTemplate is not yet loaded in active client; skipping template seed.");
      return;
    }

    const existing = await model.all();
    const existingKeys = new Set(existing.map((t: any) => t.key));
    const validKeys = new Set(DEFAULT_TEMPLATES.map((t) => t.key));

    // Remove obsolete templates not in DEFAULT_TEMPLATES
    for (const row of existing) {
      if (!validKeys.has(row.key)) {
        await model.where({ id: row.id }).delete();
      }
    }

    for (const def of DEFAULT_TEMPLATES) {
      if (!existingKeys.has(def.key)) {
        await model.create({
          key: def.key,
          name: def.name,
          nameAm: def.nameAm,
          triggerEvent: def.triggerEvent,
          language: def.language,
          body: def.body,
          variables: JSON.stringify(def.variables),
          isActive: def.isActive,
        });
      }
    }
  } catch (err) {
    console.error("Failed to seed default SMS templates:", err);
  }
}

/**
 * Fetches all SMS templates from the database, initializing defaults if none exist.
 */
export async function getSmsTemplates(): Promise<SmsTemplate[]> {
  try {
    const model = getTemplateModel();
    if (!model) {
      return DEFAULT_TEMPLATES;
    }

    await seedDefaultTemplatesIfEmpty();
    const rows = await model.all();

    if (!rows || rows.length === 0) {
      return DEFAULT_TEMPLATES;
    }

    // Preserve the canonical ordering from DEFAULT_TEMPLATES
    const orderMap = new Map(DEFAULT_TEMPLATES.map((t, idx) => [t.key, idx]));

    const mapped: SmsTemplate[] = rows.map((r: any) => {
      let vars: string[] = [];
      try {
        vars = JSON.parse(r.variables);
      } catch {
        vars = [];
      }

      return {
        id: r.id,
        key: r.key,
        name: r.name,
        nameAm: r.nameAm,
        triggerEvent: r.triggerEvent as TemplateTriggerEvent,
        language: r.language as TemplateLanguage,
        body: r.body,
        variables: vars,
        isActive: r.isActive,
        createdAt: r.createdAt ? String(r.createdAt) : undefined,
        updatedAt: r.updatedAt ? String(r.updatedAt) : undefined,
      };
    });

    mapped.sort((a, b) => {
      const orderA = orderMap.has(a.key) ? orderMap.get(a.key)! : 999;
      const orderB = orderMap.has(b.key) ? orderMap.get(b.key)! : 999;
      return orderA - orderB;
    });

    return mapped;
  } catch (err) {
    console.error("Error reading SMS templates from DB:", err);
    return DEFAULT_TEMPLATES;
  }
}

/**
 * Returns the currently active template for a given trigger event.
 * If multiple are active, returns the most recently updated one.
 * If preferredLanguage is provided, prioritizes matching that language.
 */
export async function getActiveTemplate(
  triggerEvent: TemplateTriggerEvent | string = "ABSENCE",
  preferredLanguage?: TemplateLanguage | string
): Promise<SmsTemplate> {
  try {
    const all = await getSmsTemplates();

    // 1. If explicit language requested, try matching active with that language
    if (preferredLanguage) {
      const match = all.find(
        (t) => t.triggerEvent === triggerEvent && t.language === preferredLanguage && t.isActive
      );
      if (match) return match;
    }

    // 2. Filter all active templates for this triggerEvent
    const activeCandidates = all.filter(
      (t) => t.triggerEvent === triggerEvent && t.isActive
    );

    if (activeCandidates.length === 1) {
      return activeCandidates[0];
    }

    if (activeCandidates.length > 1) {
      // Pick the most recently updated active template
      activeCandidates.sort((a, b) => {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return timeB - timeA;
      });
      return activeCandidates[0];
    }

    // 3. Fallback to any template matching triggerEvent
    const anyMatch = all.find((t) => t.triggerEvent === triggerEvent);
    if (anyMatch) return anyMatch;
  } catch (err) {
    console.error("Error fetching active template:", err);
  }

  // Final fallback to hardcoded DEFAULT_TEMPLATES
  return DEFAULT_TEMPLATES[0];
}

/**
 * Activates a template for outbound dispatches and deactivates other templates for the same trigger event.
 */
export async function setActiveTemplate(idOrKey: string): Promise<SmsTemplate[]> {
  const model = getTemplateModel();
  if (!model) return DEFAULT_TEMPLATES;

  const target =
    (await model.where({ id: idOrKey }).first()) ??
    (await model.where({ key: idOrKey }).first());

  if (!target) throw new Error(`Template '${idOrKey}' not found.`);

  const all = await model.all();
  for (const t of all) {
    if (t.triggerEvent === target.triggerEvent) {
      await model.where({ id: t.id }).update({
        isActive: t.id === target.id,
      });
    }
  }

  try {
    updateTag(CACHE_TAGS.SETTINGS);
    updateTag(CACHE_TAGS.NOTIFICATIONS);
  } catch {}

  return getSmsTemplates();
}

/**
 * Updates an SMS template by its id or key.
 */
export async function saveSmsTemplate(
  idOrKey: string,
  data: {
    body?: string;
    name?: string;
    nameAm?: string;
    isActive?: boolean;
    variables?: string[];
  }
): Promise<SmsTemplate | null> {
  const model = getTemplateModel();
  if (!model) {
    throw new Error("SmsTemplate database model is not initialized.");
  }

  const existing =
    (await model.where({ id: idOrKey }).first()) ??
    (await model.where({ key: idOrKey }).first());

  if (!existing) {
    throw new Error(`SMS Template '${idOrKey}' not found.`);
  }

  const updates: Record<string, any> = {};
  if (data.body !== undefined) updates.body = data.body;
  if (data.name !== undefined) updates.name = data.name;
  if (data.nameAm !== undefined) updates.nameAm = data.nameAm;
  if (data.isActive !== undefined) updates.isActive = data.isActive;
  if (data.variables !== undefined) updates.variables = JSON.stringify(data.variables);

  // If this template is being set active, deactivate sibling templates of the same trigger event
  if (data.isActive === true) {
    const all = await model.all();
    for (const t of all) {
      if (t.triggerEvent === existing.triggerEvent && t.id !== existing.id && t.isActive) {
        await model.where({ id: t.id }).update({ isActive: false });
      }
    }
  }

  await model.where({ id: existing.id }).update(updates);

  try {
    updateTag(CACHE_TAGS.SETTINGS);
    updateTag(CACHE_TAGS.NOTIFICATIONS);
  } catch {}

  const updated = await model.where({ id: existing.id }).first();
  if (!updated) return null;

  let vars: string[] = [];
  try {
    vars = JSON.parse(updated.variables);
  } catch {
    vars = [];
  }

  return {
    id: updated.id,
    key: updated.key,
    name: updated.name,
    nameAm: updated.nameAm,
    triggerEvent: updated.triggerEvent as TemplateTriggerEvent,
    language: updated.language as TemplateLanguage,
    body: updated.body,
    variables: vars,
    isActive: updated.isActive,
    createdAt: updated.createdAt ? String(updated.createdAt) : undefined,
    updatedAt: updated.updatedAt ? String(updated.updatedAt) : undefined,
  };
}

/**
 * Resets all templates to system defaults.
 */
export async function resetSmsTemplatesToDefaults(): Promise<SmsTemplate[]> {
  const model = getTemplateModel();
  if (!model) {
    return DEFAULT_TEMPLATES;
  }

  const validKeys = new Set(DEFAULT_TEMPLATES.map((t) => t.key));
  const existingAll = await model.all();
  for (const row of existingAll) {
    if (!validKeys.has(row.key)) {
      await model.where({ id: row.id }).delete();
    }
  }

  for (const def of DEFAULT_TEMPLATES) {
    const existing = await model.where({ key: def.key }).first();
    if (existing) {
      await model.where({ id: existing.id }).update({
        body: def.body,
        name: def.name,
        nameAm: def.nameAm,
        isActive: def.isActive,
        variables: JSON.stringify(def.variables),
      });
    } else {
      await model.create({
        key: def.key,
        name: def.name,
        nameAm: def.nameAm,
        triggerEvent: def.triggerEvent,
        language: def.language,
        body: def.body,
        variables: JSON.stringify(def.variables),
        isActive: def.isActive,
      });
    }
  }

  try {
    updateTag(CACHE_TAGS.SETTINGS);
    updateTag(CACHE_TAGS.NOTIFICATIONS);
  } catch {}

  return getSmsTemplates();
}

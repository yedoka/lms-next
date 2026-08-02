/**
 * Generators for the lesson materials the seed links to.
 *
 * Everything here writes a genuine, openable file into `public/files/` — the
 * seed then stores that file's real byte size, so the size shown in the UI is
 * the size the user actually downloads. No third-party libraries: the PDF and
 * ZIP writers below implement just enough of each format to be valid.
 */

import fs from "node:fs";
import path from "node:path";

/* -------------------------------------------------------------------------- */
/*  PDF                                                                        */
/* -------------------------------------------------------------------------- */

type PdfLine = { text: string; size: number; gapAfter: number };

const PDF_PAGE_HEIGHT = 792; // US Letter, in points
const PDF_MARGIN_LEFT = 56;
const PDF_MARGIN_TOP = 60;

// WinAnsi has no glyph for the characters we use in titles, so fold them to
// ASCII rather than emitting broken output.
const toPdfText = (value: string) =>
  value
    .replace(/[—–]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x20-\x7e]/g, "");

const escapePdfString = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

function buildPdf(lines: PdfLine[], title: string): Buffer {
  let cursorY = PDF_PAGE_HEIGHT - PDF_MARGIN_TOP;
  const operations: string[] = [];

  for (const line of lines) {
    const text = escapePdfString(toPdfText(line.text));
    operations.push(
      `BT /F1 ${line.size} Tf ${PDF_MARGIN_LEFT} ${cursorY} Td (${text}) Tj ET`,
    );
    cursorY -= line.size + line.gapAfter;
  }

  const content = operations.join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    `<< /Title (${escapePdfString(toPdfText(title))}) /Producer (Skillbase seed) >>`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  for (const [index, body] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, "latin1");
}

/* -------------------------------------------------------------------------- */
/*  ZIP (stored, no compression)                                               */
/* -------------------------------------------------------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let bit = 0; bit < 8; bit++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }

  return table;
})();

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff]!;
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date) {
  const time =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    (Math.floor(date.getSeconds() / 2) & 0x1f);
  const day =
    ((date.getFullYear() - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();

  return { time, day };
}

function buildZip(
  entries: { name: string; content: string }[],
  modifiedAt: Date,
): Buffer {
  const { time, day } = dosDateTime(modifiedAt);
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const data = Buffer.from(entry.content, "utf8");
    const crc = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // local file header signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(0, 8); // method: stored
    localHeader.writeUInt16LE(time, 10);
    localHeader.writeUInt16LE(day, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18); // compressed size
    localHeader.writeUInt32LE(data.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra length

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // central directory signature
    central.writeUInt16LE(20, 4); // version made by
    central.writeUInt16LE(20, 6); // version needed
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(day, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk number
    central.writeUInt16LE(0, 36); // internal attrs
    central.writeUInt32LE(0, 38); // external attrs
    central.writeUInt32LE(offset, 42); // local header offset

    locals.push(localHeader, nameBuffer, data);
    centrals.push(central, nameBuffer);
    offset += localHeader.length + nameBuffer.length + data.length;
  }

  const centralBuffer = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // end of central directory signature
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralBuffer, eocd]);
}

/* -------------------------------------------------------------------------- */
/*  Lesson materials                                                           */
/* -------------------------------------------------------------------------- */

export type MaterialKind = "slides" | "notes" | "exercises" | "starter" | "data";

export type LessonContext = {
  courseTitle: string;
  courseCategory: string;
  lessonTitle: string;
  lessonDescription: string;
  lessonNumber: number;
  createdAt: Date;
};

export type GeneratedMaterial = {
  name: string;
  fileName: string;
  size: number;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Generic but on-topic talking points, so a downloaded file is never empty
// filler text.
const objectivesFor = (context: LessonContext) => [
  `Explain the core idea behind "${context.lessonTitle}" in your own words.`,
  `Apply it to a small exercise inside the ${context.courseTitle} project.`,
  "Recognise the two most common mistakes and how to avoid them.",
  "Know where to look it up when you need the details again.",
];

function slidesPdf(context: LessonContext): Buffer {
  const lines: PdfLine[] = [
    { text: context.courseTitle, size: 11, gapAfter: 22 },
    { text: `Lesson ${context.lessonNumber}: ${context.lessonTitle}`, size: 20, gapAfter: 14 },
    { text: context.lessonDescription, size: 11, gapAfter: 28 },
    { text: "Learning objectives", size: 14, gapAfter: 12 },
    ...objectivesFor(context).map((objective) => ({
      text: `-  ${objective}`,
      size: 11,
      gapAfter: 8,
    })),
    { text: "", size: 11, gapAfter: 16 },
    { text: "Agenda", size: 14, gapAfter: 12 },
    { text: "1.  Concept walkthrough", size: 11, gapAfter: 8 },
    { text: "2.  Live coding demo", size: 11, gapAfter: 8 },
    { text: "3.  Guided exercise", size: 11, gapAfter: 8 },
    { text: "4.  Quiz and wrap-up", size: 11, gapAfter: 8 },
    { text: "", size: 11, gapAfter: 24 },
    {
      text: `${context.courseCategory} track - generated for the Skillbase demo dataset.`,
      size: 9,
      gapAfter: 0,
    },
  ];

  return buildPdf(lines, `${context.lessonTitle} - Slides`);
}

function exercisesPdf(context: LessonContext): Buffer {
  const lines: PdfLine[] = [
    { text: `${context.courseTitle} / Lesson ${context.lessonNumber}`, size: 11, gapAfter: 22 },
    { text: `${context.lessonTitle} - Exercises`, size: 18, gapAfter: 24 },
    { text: "Exercise 1 (warm-up)", size: 13, gapAfter: 10 },
    {
      text: "Reproduce the example from the lesson without looking at the recording.",
      size: 11,
      gapAfter: 20,
    },
    { text: "Exercise 2 (apply)", size: 13, gapAfter: 10 },
    {
      text: "Extend the example with one additional case of your choice and explain",
      size: 11,
      gapAfter: 4,
    },
    { text: "why your solution is correct.", size: 11, gapAfter: 20 },
    { text: "Exercise 3 (stretch)", size: 13, gapAfter: 10 },
    {
      text: "Find a place in your own codebase where this applies, and write down",
      size: 11,
      gapAfter: 4,
    },
    { text: "what you would change.", size: 11, gapAfter: 24 },
    { text: "Submit your answers before the next lesson.", size: 10, gapAfter: 0 },
  ];

  return buildPdf(lines, `${context.lessonTitle} - Exercises`);
}

function notesMarkdown(context: LessonContext): string {
  return [
    `# ${context.lessonTitle}`,
    "",
    `_${context.courseTitle} — lesson ${context.lessonNumber}_`,
    "",
    context.lessonDescription,
    "",
    "## Learning objectives",
    "",
    ...objectivesFor(context).map((objective) => `- ${objective}`),
    "",
    "## Summary",
    "",
    `These notes accompany the video for **${context.lessonTitle}**. Work through`,
    "the exercises before attempting the quiz — the questions assume you have",
    "actually run the examples rather than only watched them.",
    "",
    "## Checklist",
    "",
    "- [ ] Watched the lesson video",
    "- [ ] Reproduced the demo locally",
    "- [ ] Completed the exercises",
    "- [ ] Attempted the quiz",
    "",
  ].join("\n");
}

function starterZip(context: LessonContext): Buffer {
  const slug = slugify(context.lessonTitle);

  return buildZip(
    [
      {
        name: `${slug}/README.md`,
        content: [
          `# Starter code — ${context.lessonTitle}`,
          "",
          `Part of **${context.courseTitle}**, lesson ${context.lessonNumber}.`,
          "",
          "## How to use",
          "",
          "1. Unzip this archive.",
          "2. Open `notes.md` for the task description.",
          "3. Fill in the TODOs in `exercise.txt`.",
          "",
        ].join("\n"),
      },
      {
        name: `${slug}/notes.md`,
        content: notesMarkdown(context),
      },
      {
        name: `${slug}/exercise.txt`,
        content: [
          `Exercise scaffold for: ${context.lessonTitle}`,
          "",
          "TODO 1: implement the walkthrough from the lesson.",
          "TODO 2: handle the edge case discussed at the end of the video.",
          "TODO 3: write one test that would fail without your change.",
          "",
        ].join("\n"),
      },
    ],
    context.createdAt,
  );
}

function dataCsv(context: LessonContext): string {
  const rows = [
    "week,students_started,students_completed,average_quiz_score",
    "1,48,41,72",
    "2,45,36,75",
    "3,44,33,71",
    "4,41,31,78",
    "5,39,30,80",
    "6,38,29,83",
  ];

  return [
    `# Engagement export for "${context.lessonTitle}" (${context.courseTitle})`,
    ...rows,
    "",
  ].join("\n");
}

const KIND_LABELS: Record<MaterialKind, { label: string; extension: string }> = {
  slides: { label: "Slides", extension: "pdf" },
  notes: { label: "Notes", extension: "md" },
  exercises: { label: "Exercises", extension: "pdf" },
  starter: { label: "Starter Code", extension: "zip" },
  data: { label: "Engagement Data", extension: "csv" },
};

export function writeMaterial(
  outputDir: string,
  kind: MaterialKind,
  context: LessonContext,
): GeneratedMaterial {
  const { label, extension } = KIND_LABELS[kind];
  const fileName = `${slugify(context.courseTitle)}-${context.lessonNumber}-${slugify(label)}.${extension}`;
  const filePath = path.join(outputDir, fileName);

  const payload: Buffer =
    kind === "slides"
      ? slidesPdf(context)
      : kind === "exercises"
        ? exercisesPdf(context)
        : kind === "notes"
          ? Buffer.from(notesMarkdown(context), "utf8")
          : kind === "starter"
            ? starterZip(context)
            : Buffer.from(dataCsv(context), "utf8");

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(filePath, payload);

  return {
    name: `${context.lessonTitle} — ${label}.${extension}`,
    fileName,
    size: payload.length,
  };
}

export function resetMaterialsDir(outputDir: string) {
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
}

export const MATERIAL_KINDS: MaterialKind[] = [
  "slides",
  "notes",
  "exercises",
  "starter",
  "data",
];

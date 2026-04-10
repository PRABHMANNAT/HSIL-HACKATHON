"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  Droplets,
  FileArchive,
  FileText,
  PaintBucket,
  PenTool,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ProgressRing } from "@/components/ui/med/progress-ring";
import { cn } from "@/lib/utils";

type SubmissionType = "fda-510k" | "ce-tech-file" | "cdsco";
type EvidenceStatus = "complete" | "review" | "in-progress" | "missing";
type ExportFormat = "pdf" | "zip" | "docx";
type Watermark = "DRAFT" | "CONFIDENTIAL" | "SUBMITTED";

type EvidenceItem = {
  id: string;
  title: string;
  section: string;
  status: EvidenceStatus;
  linkedArtifact: string;
  lastUpdated: string;
  summary: string;
};

type ExportJob = {
  format: ExportFormat;
  submissionType: SubmissionType;
  items: EvidenceItem[];
  brandColor: string;
  headerText: string;
  footerText: string;
  logoName: string;
  signatureName: string;
  signatureAsset: string;
  watermark: Watermark;
};

const panelClass =
  "rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,17,33,0.94),rgba(4,10,22,0.9))] shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl";

const evidenceCatalog: Record<SubmissionType, EvidenceItem[]> = {
  "fda-510k": [
    {
      id: "EV-001",
      title: "Device Description",
      section: "Executive Summary",
      status: "complete",
      linkedArtifact: "design-inputs/device-description.md",
      lastUpdated: "2026-04-08",
      summary: "Dual-chamber pacemaker architecture, intended use, system boundaries, and programmer interfaces.",
    },
    {
      id: "EV-002",
      title: "Substantial Equivalence Narrative",
      section: "Executive Summary",
      status: "review",
      linkedArtifact: "reg/substantial-equivalence.xlsx",
      lastUpdated: "2026-04-09",
      summary: "Predicate comparison for pacing modes, lead interface, and telemetry service behavior.",
    },
    {
      id: "EV-003",
      title: "Risk Management File",
      section: "Safety and Risk",
      status: "complete",
      linkedArtifact: "compliance/fmea-export.csv",
      lastUpdated: "2026-04-10",
      summary: "ISO 14971 hazard analysis including EMI inhibition, loss of capture, and battery depletion.",
    },
    {
      id: "EV-004",
      title: "Software Verification Summary",
      section: "Verification and Validation",
      status: "review",
      linkedArtifact: "verification/software-summary.pdf",
      lastUpdated: "2026-04-07",
      summary: "Timing engine, telemetry isolation, and capture management verification evidence set.",
    },
    {
      id: "EV-005",
      title: "Biocompatibility Assessment",
      section: "Bench and Biocompatibility",
      status: "in-progress",
      linkedArtifact: "materials/biocompatibility-plan.docx",
      lastUpdated: "2026-04-02",
      summary: "Titanium can, lead connector materials, and implant-adjacent contact duration classification.",
    },
    {
      id: "EV-006",
      title: "Sterilization and Packaging",
      section: "Bench and Biocompatibility",
      status: "missing",
      linkedArtifact: "Not linked",
      lastUpdated: "Pending",
      summary: "Packaging validation and sterile barrier evidence not yet attached.",
    },
  ],
  "ce-tech-file": [
    {
      id: "EV-101",
      title: "General Safety and Performance Requirements Matrix",
      section: "GSPR",
      status: "complete",
      linkedArtifact: "ce/gspr-matrix.xlsx",
      lastUpdated: "2026-04-10",
      summary: "Mapped essential requirements to design, risk controls, and verification evidence.",
    },
    {
      id: "EV-102",
      title: "Clinical Evaluation Plan",
      section: "Clinical",
      status: "review",
      linkedArtifact: "clinical/cep.docx",
      lastUpdated: "2026-04-08",
      summary: "Clinical literature strategy and PMCF rationale for dual-chamber pacing claims.",
    },
    {
      id: "EV-103",
      title: "Usability Engineering File",
      section: "Usability",
      status: "in-progress",
      linkedArtifact: "ux/use-error-analysis.md",
      lastUpdated: "2026-04-06",
      summary: "Programmer interaction hazards, clinician workflow mitigations, and training assumptions.",
    },
    {
      id: "EV-104",
      title: "Cybersecurity and SOUP Assessment",
      section: "Software",
      status: "complete",
      linkedArtifact: "software/cybersecurity-assessment.pdf",
      lastUpdated: "2026-04-05",
      summary: "BLE service isolation, authenticated programmer sessions, and third-party dependency review.",
    },
    {
      id: "EV-105",
      title: "Post-Market Surveillance Plan",
      section: "Clinical",
      status: "review",
      linkedArtifact: "clinical/pms-plan.docx",
      lastUpdated: "2026-04-03",
      summary: "Complaint trending, telemetry fleet signals, and field safety corrective action triggers.",
    },
    {
      id: "EV-106",
      title: "UDI and Labeling Package",
      section: "Labeling",
      status: "missing",
      linkedArtifact: "Not linked",
      lastUpdated: "Pending",
      summary: "UDI carrier, implant card, IFU language set, and packaging artwork pending upload.",
    },
  ],
  cdsco: [
    {
      id: "EV-201",
      title: "Device Master File Summary",
      section: "Registration Core",
      status: "complete",
      linkedArtifact: "cdsco/device-master-file.pdf",
      lastUpdated: "2026-04-09",
      summary: "Manufacturing overview, plant controls, design ownership, and essential pacemaker description.",
    },
    {
      id: "EV-202",
      title: "Plant Quality Certificates",
      section: "Registration Core",
      status: "review",
      linkedArtifact: "qa/iso13485-certificates.pdf",
      lastUpdated: "2026-04-04",
      summary: "ISO 13485 and facility qualification certificates for implantable device manufacturing lines.",
    },
    {
      id: "EV-203",
      title: "Performance Evaluation Summary",
      section: "Safety and Performance",
      status: "complete",
      linkedArtifact: "verification/performance-evaluation.pptx",
      lastUpdated: "2026-04-08",
      summary: "Bench, EMC, and reliability evidence mapped to essential performance expectations.",
    },
    {
      id: "EV-204",
      title: "Shelf Life and Stability",
      section: "Safety and Performance",
      status: "in-progress",
      linkedArtifact: "packaging/shelf-life-study.xlsx",
      lastUpdated: "2026-04-01",
      summary: "Accelerated aging program and sterile barrier retention studies still under review.",
    },
    {
      id: "EV-205",
      title: "Authorized Agent Appointment",
      section: "Commercial and Legal",
      status: "missing",
      linkedArtifact: "Not linked",
      lastUpdated: "Pending",
      summary: "India authorized agent evidence not attached to the submission dossier yet.",
    },
  ],
};

const submissionLabels: Record<SubmissionType, string> = {
  "fda-510k": "FDA 510(k)",
  "ce-tech-file": "CE Technical File",
  cdsco: "CDSCO",
};

const statusOrder: EvidenceStatus[] = ["complete", "review", "in-progress", "missing"];

const statusStyles: Record<EvidenceStatus, string> = {
  complete: "bg-emerald-500/15 text-emerald-100",
  review: "bg-amber-500/15 text-amber-100",
  "in-progress": "bg-sky-500/15 text-sky-100",
  missing: "bg-red-500/15 text-red-100",
};

const sectionIcons = [FileText, FileArchive, ShieldCheck];

function cloneEvidenceItems(submissionType: SubmissionType) {
  return evidenceCatalog[submissionType].map((item) => ({ ...item }));
}

function weightForStatus(status: EvidenceStatus) {
  if (status === "complete") return 1;
  if (status === "review") return 0.72;
  if (status === "in-progress") return 0.38;
  return 0;
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function textEncoder() {
  return new TextEncoder();
}

function toBytes(value: string | Uint8Array) {
  return typeof value === "string" ? textEncoder().encode(value) : value;
}

function crc32(bytes: Uint8Array) {
  let crc = -1;

  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ -1) >>> 0;
}

function concatUint8Arrays(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }

  return merged;
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value, true);
}

function toArrayBuffer(bytes: Uint8Array) {
  const normalized = new Uint8Array(bytes.byteLength);
  normalized.set(bytes);
  return normalized.buffer;
}

function createZip(files: Array<{ name: string; data: string | Uint8Array }>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = textEncoder().encode(file.name);
    const dataBytes = toBytes(file.data);
    const fileCrc = crc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(localHeader.buffer);
    writeUint32(localView, 0, 0x04034b50);
    writeUint16(localView, 4, 20);
    writeUint16(localView, 6, 0);
    writeUint16(localView, 8, 0);
    writeUint16(localView, 10, 0);
    writeUint16(localView, 12, 0);
    writeUint32(localView, 14, fileCrc);
    writeUint32(localView, 18, dataBytes.length);
    writeUint32(localView, 22, dataBytes.length);
    writeUint16(localView, 26, nameBytes.length);
    writeUint16(localView, 28, 0);
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    writeUint32(centralView, 0, 0x02014b50);
    writeUint16(centralView, 4, 20);
    writeUint16(centralView, 6, 20);
    writeUint16(centralView, 8, 0);
    writeUint16(centralView, 10, 0);
    writeUint16(centralView, 12, 0);
    writeUint16(centralView, 14, 0);
    writeUint32(centralView, 16, fileCrc);
    writeUint32(centralView, 20, dataBytes.length);
    writeUint32(centralView, 24, dataBytes.length);
    writeUint16(centralView, 28, nameBytes.length);
    writeUint16(centralView, 30, 0);
    writeUint16(centralView, 32, 0);
    writeUint16(centralView, 34, 0);
    writeUint16(centralView, 36, 0);
    writeUint32(centralView, 38, 0);
    writeUint32(centralView, 42, offset);
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  const centralDirectory = concatUint8Arrays(centralParts);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  writeUint32(endView, 0, 0x06054b50);
  writeUint16(endView, 4, 0);
  writeUint16(endView, 6, 0);
  writeUint16(endView, 8, files.length);
  writeUint16(endView, 10, files.length);
  writeUint32(endView, 12, centralDirectory.length);
  writeUint32(endView, 16, offset);
  writeUint16(endView, 20, 0);

  return new Blob([...localParts, centralDirectory, endRecord].map(toArrayBuffer), { type: "application/zip" });
}

function buildPdf(lines: string[]) {
  const linesPerPage = 42;
  const pages = [];

  for (let start = 0; start < lines.length; start += linesPerPage) {
    const pageLines = lines.slice(start, start + linesPerPage);
    const contentStream =
      "BT\n/F1 11 Tf\n50 790 Td\n14 TL\n" +
      pageLines.map((line) => `(${escapePdfText(line)}) Tj\nT*\n`).join("") +
      "ET";
    pages.push(contentStream);
  }

  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");

  const pageObjectNumbers: number[] = [];
  const contentObjectNumbers: number[] = [];
  let objectNumber = 3;

  for (let index = 0; index < pages.length; index += 1) {
    pageObjectNumbers.push(objectNumber);
    contentObjectNumbers.push(objectNumber + 1);
    objectNumber += 2;
  }

  const fontObjectNumber = objectNumber;
  const kids = pageObjectNumbers.map((id) => `${id} 0 R`).join(" ");
  objects.push(`<< /Type /Pages /Count ${pages.length} /Kids [${kids}] >>`);

  for (let index = 0; index < pages.length; index += 1) {
    const content = pages[index];
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumbers[index]} 0 R >>`,
    );
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  }

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function buildDocx(job: ExportJob, lines: string[]) {
  const now = new Date().toISOString();
  const paragraphXml = lines
    .map((line) => `<w:p><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`)
    .join("");

  return createZip([
    {
      name: "[Content_Types].xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    },
    {
      name: "docProps/core.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(submissionLabels[job.submissionType])} Evidence Pack</dc:title>
  <dc:creator>${escapeXml(job.signatureName || "MedDevice Suite Pro")}</dc:creator>
  <cp:lastModifiedBy>${escapeXml(job.signatureName || "MedDevice Suite Pro")}</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`,
    },
    {
      name: "docProps/app.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>MedDevice Suite Pro</Application>
</Properties>`,
    },
    {
      name: "word/_rels/document.xml.rels",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: "word/styles.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
</w:styles>`,
    },
    {
      name: "word/document.xml",
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" mc:Ignorable="w14 wp14">
  <w:body>
    ${paragraphXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1080" w:bottom="1440" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`,
    },
  ]);
}

function buildZipBundle(job: ExportJob, lines: string[]) {
  const checklistCsv = [
    "ID,Title,Section,Status,Linked Artifact,Last Updated,Summary",
    ...job.items.map((item) =>
      [
        csvEscape(item.id),
        csvEscape(item.title),
        csvEscape(item.section),
        csvEscape(item.status),
        csvEscape(item.linkedArtifact),
        csvEscape(item.lastUpdated),
        csvEscape(item.summary),
      ].join(","),
    ),
  ].join("\n");

  const previewHtml = `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>${submissionLabels[job.submissionType]} Evidence Pack</title></head>
  <body>
    <h1>${submissionLabels[job.submissionType]} Evidence Pack</h1>
    <p>${job.headerText}</p>
    ${job.items
      .map(
        (item) => `<section><h2>${item.title}</h2><p>Status: ${item.status}</p><p>${item.summary}</p><p>${item.linkedArtifact}</p></section>`,
      )
      .join("")}
    <footer><p>${job.footerText}</p><p>Signed by ${job.signatureName || "Pending signature"}</p></footer>
  </body>
</html>`;

  const manifest = JSON.stringify(
    {
      submissionType: job.submissionType,
      format: job.format,
      watermark: job.watermark,
      signatureName: job.signatureName,
      signatureAsset: job.signatureAsset,
      logoName: job.logoName,
      items: job.items,
    },
    null,
    2,
  );

  return createZip([
    { name: "evidence-pack.txt", data: lines.join("\n") },
    { name: "evidence-checklist.csv", data: checklistCsv },
    { name: "preview.html", data: previewHtml },
    { name: "manifest.json", data: manifest },
  ]);
}

function buildPackLines(job: ExportJob) {
  return [
    `${submissionLabels[job.submissionType]} Evidence Pack`,
    `Watermark: ${job.watermark}`,
    `Header: ${job.headerText || "Not set"}`,
    `Footer: ${job.footerText || "Not set"}`,
    `Logo: ${job.logoName || "No logo uploaded"}`,
    `Signature: ${job.signatureName || job.signatureAsset || "Not provided"}`,
    "",
    ...job.items.flatMap((item) => [
      `${item.id} | ${item.title}`,
      `Section: ${item.section}`,
      `Status: ${item.status}`,
      `Artifact: ${item.linkedArtifact}`,
      `Last updated: ${item.lastUpdated}`,
      item.summary,
      "",
    ]),
  ];
}

export function EvidencePackBuilder() {
  const [submissionType, setSubmissionType] = React.useState<SubmissionType>("fda-510k");
  const [items, setItems] = React.useState<EvidenceItem[]>(cloneEvidenceItems("fda-510k"));
  const [selectedItemId, setSelectedItemId] = React.useState(items[0]?.id ?? "");
  const [brandColor, setBrandColor] = React.useState("#2bd4bf");
  const [headerText, setHeaderText] = React.useState("HSIL Cardiac Systems | Regulatory Evidence Pack");
  const [footerText, setFooterText] = React.useState("Controlled copy generated from MedDevice Suite Pro");
  const [logoName, setLogoName] = React.useState("");
  const [signatureName, setSignatureName] = React.useState("Dr. A. Mehta");
  const [signatureAsset, setSignatureAsset] = React.useState("");
  const [watermark, setWatermark] = React.useState<Watermark>("DRAFT");
  const [exportFormat, setExportFormat] = React.useState<ExportFormat>("pdf");
  const [job, setJob] = React.useState<ExportJob | null>(null);
  const [sectionProgress, setSectionProgress] = React.useState<Record<string, number>>({});
  const [generatedAt, setGeneratedAt] = React.useState<string>("");

  React.useEffect(() => {
    const nextItems = cloneEvidenceItems(submissionType);
    setItems(nextItems);
    setSelectedItemId(nextItems[0]?.id ?? "");
  }, [submissionType]);

  const sections = Array.from(
    items.reduce((map, item) => {
      const sectionItems = map.get(item.section) ?? [];
      sectionItems.push(item);
      map.set(item.section, sectionItems);
      return map;
    }, new Map<string, EvidenceItem[]>()),
  );

  const completion = Math.round(
    (items.reduce((sum, item) => sum + weightForStatus(item.status), 0) / Math.max(items.length, 1)) * 100,
  );

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0];

  React.useEffect(() => {
    if (!job) {
      return;
    }

    setSectionProgress(Object.fromEntries(sections.map(([section]) => [section, 0])));

    let sectionIndex = 0;
    let currentProgress = 0;
    const sectionNames = sections.map(([section]) => section);

    const interval = window.setInterval(() => {
      const sectionName = sectionNames[sectionIndex];
      if (!sectionName) {
        window.clearInterval(interval);
        const lines = buildPackLines(job);
        const fileBase = `${submissionLabels[job.submissionType]} Evidence Pack`;

        if (job.format === "pdf") {
          downloadBlob(buildPdf(lines), `${fileBase}.pdf`);
        } else if (job.format === "docx") {
          downloadBlob(buildDocx(job, lines), `${fileBase}.docx`);
        } else {
          downloadBlob(buildZipBundle(job, lines), `${fileBase}.zip`);
        }

        setGeneratedAt(new Date().toLocaleString());
        setJob(null);
        return;
      }

      currentProgress = Math.min(currentProgress + 14, 100);
      setSectionProgress((existing) => ({ ...existing, [sectionName]: currentProgress }));

      if (currentProgress >= 100) {
        sectionIndex += 1;
        currentProgress = 0;
      }
    }, 130);

    return () => window.clearInterval(interval);
  }, [job, sections]);

  function cycleStatus(itemId: string) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const nextStatus = statusOrder[(statusOrder.indexOf(item.status) + 1) % statusOrder.length];
        return {
          ...item,
          status: nextStatus,
          lastUpdated: new Date().toISOString().slice(0, 10),
        };
      }),
    );
  }

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setLogoName(file.name);
    }
  }

  function handleSignatureUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      setSignatureAsset(file.name);
    }
  }

  function handleSignatureDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setSignatureAsset(file.name);
    }
  }

  function startGeneration() {
    setJob({
      format: exportFormat,
      submissionType,
      items,
      brandColor,
      headerText,
      footerText,
      logoName,
      signatureName,
      signatureAsset,
      watermark,
    });
  }

  return (
    <div className="space-y-6">
      <section className={cn(panelClass, "overflow-hidden p-6 sm:p-7")}>
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <Badge className="bg-cyan-500/15 text-cyan-100">Regulatory Evidence Builder</Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Assemble submission-ready evidence packs with controlled branding and signatures.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300">
                Switch between 510(k), CE, and CDSCO dossiers, track document completeness, and generate PDF, DOCX,
                or ZIP outputs from the current artifact set.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Submission type</div>
              <div className="mt-4 text-lg font-semibold text-white">{submissionLabels[submissionType]}</div>
              <div className="mt-2 text-sm text-slate-300">{items.length} required documents in current pack.</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Completeness</div>
              <div className="mt-4 text-3xl font-semibold text-white">{completion}%</div>
              <div className="mt-2 text-sm text-slate-300">Weighted by complete, review, in-progress, and missing states.</div>
            </div>
            <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/8 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-emerald-100/70">Last generated</div>
              <div className="mt-4 text-sm font-medium text-white">{generatedAt || "No pack generated yet"}</div>
              <div className="mt-2 text-sm text-emerald-50/80">Generation is staged section by section before download.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <Tabs value={submissionType} onValueChange={(value) => setSubmissionType(value as SubmissionType)}>
          <TabsList className="rounded-[18px] border border-white/10 bg-slate-950/55 p-1">
            <TabsTrigger value="fda-510k" className="px-4">
              FDA 510(k)
            </TabsTrigger>
            <TabsTrigger value="ce-tech-file" className="px-4">
              CE Technical File
            </TabsTrigger>
            <TabsTrigger value="cdsco" className="px-4">
              CDSCO
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
          <section className={cn(panelClass, "flex min-h-[760px] flex-col overflow-hidden p-5")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Checklist</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Required evidence</h2>
              </div>
              <Badge className="bg-white/10 text-slate-100">{items.length} items</Badge>
            </div>
            <ScrollArea className="mt-5 flex-1 pr-2">
              <div className="space-y-3">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={cn(
                      "w-full rounded-[22px] border p-4 text-left transition-all",
                      selectedItemId === item.id
                        ? "border-cyan-400/40 bg-cyan-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/8",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.id}</div>
                        <div className="mt-2 text-sm font-medium leading-5 text-white">{item.title}</div>
                      </div>
                      <Badge className={statusStyles[item.status]}>{item.status}</Badge>
                    </div>
                    <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">{item.section}</div>
                    <div className="mt-3 text-sm text-slate-300">{item.linkedArtifact}</div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-400">Updated {item.lastUpdated}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-100 hover:bg-white/10"
                        onClick={(event) => {
                          event.stopPropagation();
                          cycleStatus(item.id);
                        }}
                      >
                        Advance Status
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </section>

          <section className={cn(panelClass, "min-h-[760px] overflow-hidden p-5")}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Evidence pack preview</div>
                <h2 className="mt-2 text-xl font-semibold text-white">{submissionLabels[submissionType]}</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                <Sparkles className="size-3.5 text-cyan-300" />
                Live preview updates from branding controls
              </div>
            </div>

            <ScrollArea className="mt-5 h-[650px] pr-4">
              <div className="space-y-6">
                <motion.article
                  layout
                  className="relative overflow-hidden rounded-[32px] border border-slate-300/20 bg-[#f8fbff] p-8 text-slate-900 shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-2"
                    style={{ background: `linear-gradient(90deg, ${brandColor}, color-mix(in srgb, ${brandColor} 52%, white))` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[110px] font-semibold tracking-[0.18em] text-slate-200/45">
                    {watermark}
                  </div>
                  <div className="relative space-y-8">
                    <header className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
                      <div>
                        <div className="text-xs uppercase tracking-[0.28em] text-slate-500">{headerText}</div>
                        <h3 className="mt-3 text-3xl font-semibold">{submissionLabels[submissionType]} Evidence Pack</h3>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                          Consolidated design, verification, risk, and submission artifacts for the dual-chamber
                          pacemaker program.
                        </p>
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        <div>{logoName || "No logo uploaded"}</div>
                        <div className="mt-2">Color theme {brandColor.toUpperCase()}</div>
                      </div>
                    </header>

                    <section className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Completeness</div>
                        <div className="mt-3 text-3xl font-semibold text-slate-900">{completion}%</div>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Current watermark</div>
                        <div className="mt-3 text-2xl font-semibold text-slate-900">{watermark}</div>
                      </div>
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Prepared by</div>
                        <div className="mt-3 text-lg font-semibold text-slate-900">
                          {signatureName || signatureAsset || "Pending sign-off"}
                        </div>
                      </div>
                    </section>

                    {sections.map(([section, sectionItems]) => (
                      <section key={section} className="rounded-[26px] border border-slate-200 bg-white p-6">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{section}</div>
                            <div className="mt-2 text-xl font-semibold text-slate-900">
                              {sectionItems.length} linked artifacts
                            </div>
                          </div>
                          <Badge className="bg-slate-900 text-white">
                            {Math.round(
                              (sectionItems.reduce((sum, item) => sum + weightForStatus(item.status), 0) /
                                Math.max(sectionItems.length, 1)) *
                                100,
                            )}
                            %
                          </Badge>
                        </div>
                        <div className="mt-4 space-y-4">
                          {sectionItems.map((item) => (
                            <div
                              key={item.id}
                              className={cn(
                                "rounded-[20px] border p-4 transition-all",
                                selectedItemId === item.id ? "border-cyan-400/35 bg-cyan-50" : "border-slate-200 bg-slate-50",
                              )}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.id}</div>
                                  <div className="mt-2 text-base font-semibold text-slate-900">{item.title}</div>
                                </div>
                                <Badge className={cn("capitalize", statusStyles[item.status])}>{item.status}</Badge>
                              </div>
                              <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
                              <div className="mt-3 text-sm text-slate-500">{item.linkedArtifact}</div>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}

                    <footer className="flex items-center justify-between border-t border-slate-200 pt-6 text-sm text-slate-500">
                      <div>{footerText}</div>
                      <div>{signatureName || signatureAsset || "Unsigned"}</div>
                    </footer>
                  </div>
                </motion.article>
              </div>
            </ScrollArea>
          </section>

          <section className={cn(panelClass, "min-h-[760px] overflow-hidden p-5")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Export controls</div>
                <h2 className="mt-2 text-xl font-semibold text-white">Packaging controls</h2>
              </div>
              <Badge className="bg-white/10 text-slate-100">{exportFormat.toUpperCase()}</Badge>
            </div>

            <div className="mt-5 flex justify-center">
              <ProgressRing percentage={completion} label="Evidence completeness" size={148} color={brandColor} />
            </div>

            <div className="mt-6 space-y-5">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <PaintBucket className="size-4 text-cyan-300" />
                  Branding
                </div>
                <div className="mt-4 space-y-3">
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-500">
                    Company logo
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-2 block w-full text-sm text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
                      onChange={handleLogoUpload}
                    />
                  </label>
                  <div className="text-xs text-slate-400">{logoName || "No logo asset selected."}</div>
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-500">
                    Document color
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(event) => setBrandColor(event.target.value)}
                      className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-transparent"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-500">
                    Header text
                    <Textarea
                      value={headerText}
                      onChange={(event) => setHeaderText(event.target.value)}
                      className="mt-2 min-h-[74px] border-white/10 bg-slate-950/45 text-slate-100"
                    />
                  </label>
                  <label className="block text-xs uppercase tracking-[0.18em] text-slate-500">
                    Footer text
                    <Textarea
                      value={footerText}
                      onChange={(event) => setFooterText(event.target.value)}
                      className="mt-2 min-h-[74px] border-white/10 bg-slate-950/45 text-slate-100"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <PenTool className="size-4 text-cyan-300" />
                  Digital signature
                </div>
                <div
                  className="mt-4 rounded-[20px] border border-dashed border-white/15 bg-slate-950/45 p-4 text-center text-sm text-slate-300"
                  onDrop={handleSignatureDrop}
                  onDragOver={(event) => event.preventDefault()}
                >
                  Drag and drop a signature asset here
                  <div className="mt-2 text-xs text-slate-500">{signatureAsset || "No dropped asset yet"}</div>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-3 block w-full text-sm text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-medium file:text-white"
                    onChange={handleSignatureUpload}
                  />
                </div>
                <label className="mt-4 block text-xs uppercase tracking-[0.18em] text-slate-500">
                  Typed signatory
                  <Textarea
                    value={signatureName}
                    onChange={(event) => setSignatureName(event.target.value)}
                    className="mt-2 min-h-[70px] border-white/10 bg-slate-950/45 text-slate-100"
                  />
                </label>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Droplets className="size-4 text-cyan-300" />
                  Export options
                </div>
                <div className="mt-4 space-y-3">
                  <Select value={watermark} onValueChange={(value) => setWatermark(value as Watermark)}>
                    <SelectTrigger className="border-white/10 bg-slate-950/45 text-slate-100">
                      <SelectValue placeholder="Watermark" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">DRAFT</SelectItem>
                      <SelectItem value="CONFIDENTIAL">CONFIDENTIAL</SelectItem>
                      <SelectItem value="SUBMITTED">SUBMITTED</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                    <SelectTrigger className="border-white/10 bg-slate-950/45 text-slate-100">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="zip">ZIP</SelectItem>
                      <SelectItem value="docx">DOCX</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full bg-white text-slate-950 hover:bg-slate-100"
                    onClick={startGeneration}
                    disabled={Boolean(job)}
                  >
                    <Download className="size-4" />
                    {job ? "Generating..." : "Generate Evidence Pack"}
                  </Button>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-medium text-white">Section progress</div>
                <div className="mt-4 space-y-4">
                  {sections.map(([section, sectionItems], index) => {
                    const sectionScore = Math.round(
                      (sectionItems.reduce((sum, item) => sum + weightForStatus(item.status), 0) /
                        Math.max(sectionItems.length, 1)) *
                        100,
                    );
                    const Icon = sectionIcons[index % sectionIcons.length];

                    return (
                      <div key={section} className="rounded-[20px] border border-white/10 bg-slate-950/45 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-white">
                            <Icon className="size-4 text-cyan-300" />
                            {section}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-100 hover:bg-white/10"
                            onClick={() => {
                              const firstItem = sectionItems[0];
                              if (firstItem) {
                                setSelectedItemId(firstItem.id);
                              }
                            }}
                          >
                            Go to
                          </Button>
                        </div>
                        <div className="mt-3">
                          <Progress value={job ? sectionProgress[section] ?? 0 : sectionScore} />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                          <span>{job ? `${sectionProgress[section] ?? 0}% generated` : `${sectionScore}% complete`}</span>
                          {sectionScore < 60 ? (
                            <span className="text-red-200">Missing artifacts</span>
                          ) : (
                            <span className="text-emerald-200">On track</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      {selectedItem ? (
        <section className={cn(panelClass, "p-5")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected checklist item</div>
              <h2 className="mt-2 text-xl font-semibold text-white">{selectedItem.title}</h2>
            </div>
            <Badge className={statusStyles[selectedItem.status]}>{selectedItem.status}</Badge>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
              {selectedItem.summary}
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <CheckCircle2 className="size-4 text-emerald-300" />
                Linked artifact and controls
              </div>
              <div className="mt-3 text-sm text-slate-300">{selectedItem.linkedArtifact}</div>
              <div className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                Last updated {selectedItem.lastUpdated}
              </div>
              <div className="mt-4 text-xs text-slate-400">
                Pack output uses the currently selected brand color, watermark, and signature controls.
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

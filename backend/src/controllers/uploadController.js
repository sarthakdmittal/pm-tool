const XLSX = require('xlsx');
const multer = require('multer');
const Project = require('../models/Project');
const Material = require('../models/Material');
const { ActiveDevice, ActiveDeviceColumn } = require('../models/ActiveDevice');
const EPBAXItem = require('../models/EPBAXItem');
const PassiveItem = require('../models/PassiveItem');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

exports.upload = upload.single('file');

// ─── Sheet finders ──────────────────────────────────────────────────────────

function findSheet(workbook, keywords) {
  const name = workbook.SheetNames.find((n) =>
    keywords.some((kw) => n.toLowerCase().includes(kw.toLowerCase()))
  );
  return name ? workbook.Sheets[name] : null;
}

// ─── Material Status parser ──────────────────────────────────────────────────

function parseMaterialStatus(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const projectInfo = {};
  const materials = [];
  let dataTableStarted = false;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const firstCell = String(row[0] || '').trim().toUpperCase();

    if (!dataTableStarted) {
      if (firstCell.includes('PROJECT NAME')) projectInfo.name = String(row[1] || '').trim();
      else if (firstCell.includes('PROJECT MANAGER')) projectInfo.projectManager = String(row[1] || '').trim();
      else if (firstCell.includes('SCOPE STATEMENT')) projectInfo.scopeStatement = String(row[1] || '').trim();
      else if (firstCell.includes('PROJECT START DATE')) projectInfo.startDate = row[1];
      else if (firstCell.includes('PLANNED PROJECT COMPLETION')) projectInfo.plannedCompletionDate = row[1];
      else if (firstCell.includes('LD START DATE')) projectInfo.ldStartDate = row[1];
      else if (
        firstCell === 'S.NO.' ||
        firstCell === 'S.NO' ||
        firstCell === 'SL.NO.' ||
        firstCell === 'SL.NO' ||
        firstCell === 'S.NO' ||
        firstCell.startsWith('S.N')
      ) {
        dataTableStarted = true;
        // headers row — skip to next iteration for data
      }
    } else {
      // Skip empty rows
      if (!row[0] && !row[1]) continue;
      const desc = String(row[1] || '').trim();
      if (!desc) continue;

      const material = {
        sNo: row[0] || undefined,
        description: desc,
        orderedQty: row[2] !== '' ? Number(row[2]) || undefined : undefined,
        unit: String(row[3] || '').trim() || undefined,
        billedQty: row[4] !== '' ? Number(row[4]) || undefined : undefined,
        invoicedNumber: String(row[5] || '').trim() || undefined,
        completionStatus: String(row[6] || '').trim() || '',
        executedQty: row[7] !== '' ? Number(row[7]) || undefined : undefined,
        remainingQty: row[8] !== '' ? Number(row[8]) || undefined : undefined,
        expectedClosureSchedule: String(row[9] || '').trim() || undefined,
        dependencyIfAny: String(row[10] || '').trim() || undefined,
        ownership: String(row[11] || '').trim() || undefined,
        expectedResolutionTime: String(row[12] || '').trim() || undefined,
        remarks: String(row[13] || '').trim() || undefined,
      };
      materials.push(material);
    }
  }

  return { projectInfo, materials };
}

// ─── Active Device parser ────────────────────────────────────────────────────

function parseActiveDevice(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  let headerRow = null;
  let deviceColumns = [];
  const entries = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const firstCell = String(row[0] || '').trim().toUpperCase();

    if (!headerRow) {
      if (firstCell.includes('S.NO') || firstCell.includes('SL.NO') || firstCell === 'SL') {
        headerRow = row;
        deviceColumns = row
          .slice(2)
          .map((h) => String(h || '').trim())
          .filter(Boolean);
      }
      continue;
    }

    if (firstCell === 'TOTAL') continue;
    const areaLocation = String(row[1] || '').trim();
    if (!areaLocation) continue;

    const entry = {
      sNo: row[0] !== '' ? Number(row[0]) || undefined : undefined,
      areaLocation,
      deviceItems: deviceColumns.map((col, idx) => ({
        itemName: col,
        quantity: Number(row[2 + idx]) || 0,
      })),
    };
    entries.push(entry);
  }

  return { deviceColumns, entries };
}

// ─── EPBAX parser ────────────────────────────────────────────────────────────

function parseEPBAX(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const items = [];
  let started = false;

  for (const row of rows) {
    const first = String(row[0] || '').trim().toUpperCase();
    if (!started) {
      if (first.includes('SL') || first.includes('S.NO')) {
        started = true;
        continue;
      }
      continue;
    }
    const location = String(row[1] || '').trim();
    if (!location) continue;
    items.push({
      slNo: row[0] !== '' ? Number(row[0]) || undefined : undefined,
      location,
      installationStatus: String(row[2] || '').trim() || undefined,
      handoverStatus: String(row[3] || '').trim() || undefined,
      pendingWork: String(row[4] || '').trim() || undefined,
      remarks: String(row[5] || '').trim() || undefined,
    });
  }
  return items;
}

// ─── Passive parser ──────────────────────────────────────────────────────────

function parsePassive(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const items = [];
  let started = false;

  for (const row of rows) {
    const first = String(row[0] || '').trim().toUpperCase();
    if (!started) {
      if (first.includes('SL') || first.includes('S.NO')) {
        started = true;
        continue;
      }
      continue;
    }
    const location = String(row[1] || '').trim();
    if (!location) continue;
    items.push({
      slNo: row[0] !== '' ? Number(row[0]) || undefined : undefined,
      location,
      cablingAllocated: Number(row[2]) || 0,
      cablingCompleted: Number(row[3]) || 0,
      cablingVendor: String(row[4] || '').trim() || undefined,
      remarks: String(row[5] || '').trim() || undefined,
    });
  }
  return items;
}

// ─── Parse excel date ────────────────────────────────────────────────────────

function parseExcelDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    return new Date((value - 25569) * 86400 * 1000);
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// ─── Main upload handler ─────────────────────────────────────────────────────

exports.uploadExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });

    // ── Material Status sheet ──────────────────────────────────────────────
    const materialSheet = findSheet(workbook, ['material', 'status']);
    let projectInfo = {};
    let parsedMaterials = [];

    if (materialSheet) {
      const result = parseMaterialStatus(materialSheet);
      projectInfo = result.projectInfo;
      parsedMaterials = result.materials;
    }

    // Require at minimum a project name from the sheet or request body
    const projectName =
      projectInfo.name ||
      req.body.projectName ||
      `Imported Project ${new Date().toLocaleDateString()}`;

    const startDate = parseExcelDate(projectInfo.startDate) || new Date();
    const endDate =
      parseExcelDate(projectInfo.plannedCompletionDate) ||
      new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000);

    // Create the project
    const project = await Project.create({
      name: projectName,
      description: projectInfo.scopeStatement || '',
      clientName: '',
      location: '',
      projectCode: '',
      startDate,
      endDate,
      status: 'active',
      createdBy: req.user._id,
    });

    // Save materials
    const savedMaterials = [];
    for (const mat of parsedMaterials) {
      const saved = await Material.create({ ...mat, project: project._id });
      savedMaterials.push(saved);
    }

    // ── Active Device sheet ────────────────────────────────────────────────
    const activeSheet = findSheet(workbook, ['active', 'device', 'inst']);
    let savedActiveDevices = [];
    let savedActiveColumns = null;

    if (activeSheet) {
      const { deviceColumns, entries } = parseActiveDevice(activeSheet);

      if (deviceColumns.length > 0) {
        savedActiveColumns = await ActiveDeviceColumn.findOneAndUpdate(
          { project: project._id },
          { project: project._id, columns: deviceColumns },
          { upsert: true, new: true }
        );
      }

      for (const entry of entries) {
        const saved = await ActiveDevice.create({ ...entry, project: project._id });
        savedActiveDevices.push(saved);
      }
    }

    // ── EPBAX sheet ────────────────────────────────────────────────────────
    const epbaxSheet = findSheet(workbook, ['epbax', 'pbax', 'epabx']);
    let savedEpbax = [];

    if (epbaxSheet) {
      const items = parseEPBAX(epbaxSheet);
      for (const item of items) {
        const saved = await EPBAXItem.create({ ...item, project: project._id });
        savedEpbax.push(saved);
      }
    }

    // ── Passive sheet ──────────────────────────────────────────────────────
    const passiveSheet = findSheet(workbook, ['passive']);
    let savedPassive = [];

    if (passiveSheet) {
      const items = parsePassive(passiveSheet);
      for (const item of items) {
        const saved = await PassiveItem.create({ ...item, project: project._id });
        savedPassive.push(saved);
      }
    }

    res.status(201).json({
      project,
      summary: {
        materialsCreated: savedMaterials.length,
        activeDevicesCreated: savedActiveDevices.length,
        activeDeviceColumns: savedActiveColumns ? savedActiveColumns.columns : [],
        epbaxItemsCreated: savedEpbax.length,
        passiveItemsCreated: savedPassive.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

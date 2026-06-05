/**
 * ADONE — form → Google Sheet + optional Telegram bot
 *
 * 1. Paste your SPREADSHEET_ID below (from the sheet URL)
 * 2. Run setupSheet once
 * 3. Run testWebhook — check Leads tab
 * 4. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone
 */

// From URL: https://docs.google.com/spreadsheets/d/THIS_ID/edit
var SPREADSHEET_ID = '1--4iHCzLw1BM6ug2upba7JBwTxwiewVae2A9pYCXTzY';

var SHEET_NAME = 'Leads';

function getSpreadsheet_() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === 'PASTE_YOUR_SPREADSHEET_ID_HERE') {
    throw new Error('Set SPREADSHEET_ID at the top of the script (copy from your Google Sheet URL)');
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet_() {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Timestamp (UTC)',
      'Name',
      'Channel',
      'Vertical',
      'Monthly spend',
      'Client contact',
      'Preferred messenger',
      'Source',
      'Page URL'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function parsePayload_(e) {
  if (e && e.parameter && e.parameter.data) {
    return JSON.parse(e.parameter.data);
  }
  if (e && e.postData && e.postData.contents) {
    var raw = e.postData.contents;
    var ctype = e.postData.type || '';
    if (ctype.indexOf('application/x-www-form-urlencoded') >= 0) {
      var pairs = raw.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var eq = pairs[i].indexOf('=');
        if (eq === -1) continue;
        var key = decodeURIComponent(pairs[i].substring(0, eq).replace(/\+/g, ' '));
        if (key === 'data') {
          return JSON.parse(decodeURIComponent(pairs[i].substring(eq + 1).replace(/\+/g, ' ')));
        }
      }
    }
    return JSON.parse(raw);
  }
  throw new Error('No data received');
}

function sendTelegram_(text) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TG_BOT_TOKEN');
  var chatId = props.getProperty('TG_CHAT_ID');
  if (!token || !chatId) return;

  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: chatId,
      text: text,
      disable_web_page_preview: true
    }),
    muteHttpExceptions: true
  });
}

function handleLead_(data) {
  if (data.website) {
    return { ok: true, skipped: 'spam' };
  }

  var required = ['name', 'contact'];
  for (var i = 0; i < required.length; i++) {
    if (!data[required[i]] || String(data[required[i]]).trim() === '') {
      throw new Error('Missing field: ' + required[i]);
    }
  }

  var sheet = getSheet_();
  var row = [
    new Date(),
    data.name,
    data.channel || '',
    data.vertical || '',
    data.spend || '',
    data.contact,
    data.messenger || '',
    data.source || 'adone.agency',
    data.pageUrl || ''
  ];

  sheet.appendRow(row);

  sendTelegram_([
    '🆕 ADONE — new lead',
    '',
    'Name: ' + data.name,
    'Channel: ' + (data.channel || '—'),
    'Vertical: ' + (data.vertical || '—'),
    'Spend: ' + (data.spend || '—'),
    'Contact: ' + data.contact,
    'Reply via: ' + (data.messenger || '—'),
    'Source: ' + (data.source || 'adone.agency')
  ].join('\n'));

  return {
    ok: true,
    sheet: SHEET_NAME,
    row: sheet.getLastRow()
  };
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.data) {
      return jsonResponse_(handleLead_(JSON.parse(e.parameter.data)));
    }
    return jsonResponse_({
      ok: true,
      service: 'ADONE leads webhook',
      spreadsheetId: SPREADSHEET_ID === 'PASTE_YOUR_SPREADSHEET_ID_HERE' ? 'NOT_SET' : SPREADSHEET_ID
    });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    return jsonResponse_(handleLead_(parsePayload_(e)));
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  }
}

/** Run once — creates Leads sheet */
function setupSheet() {
  var ss = getSpreadsheet_();
  getSheet_();
  Logger.log('OK: ' + ss.getName() + ' → sheet "' + SHEET_NAME + '"');
}

/** Run in editor — must add a row to Leads */
function testWebhook() {
  var result = handleLead_({
    name: 'Test from Apps Script',
    channel: 'Google Ads',
    vertical: 'Other',
    spend: '$500 – $1,000',
    contact: '@test',
    messenger: 'Telegram',
    source: 'manual-test',
    pageUrl: 'apps-script'
  });
  Logger.log(JSON.stringify(result));
}

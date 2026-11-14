/* RADIO REWARDS — tiny dependency-free QR Code generator (byte mode, error correction M, versions 1–10).
 * Works offline. Output verified with an independent decoder (OpenCV) — see TESTING in the report. */
(function (root) {
  'use strict';
  var ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];  // level M, index = version
  var NUM_BLOCKS    = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];           // level M
  var MAX_VERSION = 10;

  function rawModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) { var n = Math.floor(ver / 7) + 2; r -= (25 * n - 10) * n - 55; if (ver >= 7) r -= 36; }
    return r;
  }
  function dataCodewords(ver) { return Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ver] * NUM_BLOCKS[ver]; }
  function gfMul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; }
  function rsDivisor(deg) {
    var res = []; for (var i = 0; i < deg - 1; i++) res.push(0); res.push(1);
    var root = 1;
    for (var k = 0; k < deg; k++) {
      for (var j = 0; j < res.length; j++) { res[j] = gfMul(res[j], root); if (j + 1 < res.length) res[j] ^= res[j + 1]; }
      root = gfMul(root, 2);
    }
    return res;
  }
  function rsRemainder(data, div) {
    var res = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ res.shift(); res.push(0);
      div.forEach(function (c, i) { res[i] ^= gfMul(c, f); });
    });
    return res;
  }
  function utf8(str) { return Array.prototype.slice.call(new TextEncoder().encode(str)); }
  function bit(x, i) { return ((x >>> i) & 1) !== 0; }

  function encode(text) {
    var bytes = utf8(String(text));
    var ver, usedBits;
    for (ver = 1; ver <= MAX_VERSION; ver++) {
      var cc = ver <= 9 ? 8 : 16;
      usedBits = 4 + cc + bytes.length * 8;
      if (usedBits <= dataCodewords(ver) * 8) break;
    }
    if (ver > MAX_VERSION) throw new Error('QR_TEXT_TOO_LONG');
    var bits = [];
    function push(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    push(4, 4); push(bytes.length, ver <= 9 ? 8 : 16); bytes.forEach(function (b) { push(b, 8); });
    var cap = dataCodewords(ver) * 8;
    push(0, Math.min(4, cap - bits.length));
    while (bits.length % 8) bits.push(0);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) push(pad, 8);
    var data = []; for (var i = 0; i < bits.length; i += 8) { var v = 0; for (var j = 0; j < 8; j++) v = (v << 1) | bits[i + j]; data.push(v); }

    // split into blocks, add ECC, interleave
    var nb = NUM_BLOCKS[ver], eccLen = ECC_PER_BLOCK[ver], raw = Math.floor(rawModules(ver) / 8);
    var shortBlocks = nb - raw % nb, shortLen = Math.floor(raw / nb);
    var blocks = [], div = rsDivisor(eccLen), k = 0;
    for (var b = 0; b < nb; b++) {
      var dat = data.slice(k, k + shortLen - eccLen + (b < shortBlocks ? 0 : 1)); k += dat.length;
      var ecc = rsRemainder(dat, div);
      if (b < shortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var all = [];
    for (var x = 0; x < blocks[0].length; x++) blocks.forEach(function (blk, idx) { if (x !== shortLen - eccLen || idx >= shortBlocks) all.push(blk[x]); });

    // matrix
    var size = ver * 4 + 17, mod = [], fn = [];
    for (var y = 0; y < size; y++) { mod.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function setFn(x, y, dark) { mod[y][x] = dark; fn[y][x] = true; }
    for (var t = 0; t < size; t++) { setFn(6, t, t % 2 === 0); setFn(t, 6, t % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
        if (xx >= 0 && xx < size && yy >= 0 && yy < size) setFn(xx, yy, d !== 2 && d !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var pos = [];
    if (ver > 1) {
      var na = Math.floor(ver / 7) + 2, step = Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2;
      pos = [6]; for (var p = size - 7; pos.length < na; p -= step) pos.splice(1, 0, p);
      for (var a = 0; a < na; a++) for (var c = 0; c < na; c++) {
        if ((a === 0 && c === 0) || (a === 0 && c === na - 1) || (a === na - 1 && c === 0)) continue;
        for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) setFn(pos[a] + dx, pos[c] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
    function formatBits(mask) {
      var d = (0 << 3) | mask, rem = d;  // ECC level M => format bits 00
      for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var bits = ((d << 10) | rem) ^ 0x5412;
      for (var i2 = 0; i2 <= 5; i2++) setFn(8, i2, bit(bits, i2));
      setFn(8, 7, bit(bits, 6)); setFn(8, 8, bit(bits, 7)); setFn(7, 8, bit(bits, 8));
      for (var i3 = 9; i3 < 15; i3++) setFn(14 - i3, 8, bit(bits, i3));
      for (var i4 = 0; i4 < 8; i4++) setFn(size - 1 - i4, 8, bit(bits, i4));
      for (var i5 = 8; i5 < 15; i5++) setFn(8, size - 15 + i5, bit(bits, i5));
      setFn(8, size - 8, true);
    }
    formatBits(0);
    if (ver >= 7) {
      var r2 = ver; for (var q = 0; q < 12; q++) r2 = (r2 << 1) ^ ((r2 >>> 11) * 0x1F25);
      var vb = (ver << 12) | r2;
      for (var m = 0; m < 18; m++) { var col = bit(vb, m), a2 = size - 11 + m % 3, b2 = Math.floor(m / 3); setFn(a2, b2, col); setFn(b2, a2, col); }
    }
    // place data
    var n = 0;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var jj = 0; jj < 2; jj++) {
        var xx2 = right - jj, up = ((right + 1) & 2) === 0, yy2 = up ? size - 1 - vert : vert;
        if (!fn[yy2][xx2] && n < all.length * 8) { mod[yy2][xx2] = bit(all[n >>> 3], 7 - (n & 7)); n++; }
      }
    }
    function applyMask(mk) {
      for (var y3 = 0; y3 < size; y3++) for (var x3 = 0; x3 < size; x3++) {
        var inv;
        switch (mk) {
          case 0: inv = (x3 + y3) % 2 === 0; break; case 1: inv = y3 % 2 === 0; break; case 2: inv = x3 % 3 === 0; break;
          case 3: inv = (x3 + y3) % 3 === 0; break; case 4: inv = (Math.floor(x3 / 3) + Math.floor(y3 / 2)) % 2 === 0; break;
          case 5: inv = x3 * y3 % 2 + x3 * y3 % 3 === 0; break; case 6: inv = (x3 * y3 % 2 + x3 * y3 % 3) % 2 === 0; break;
          default: inv = ((x3 + y3) % 2 + x3 * y3 % 3) % 2 === 0;
        }
        if (!fn[y3][x3] && inv) mod[y3][x3] = !mod[y3][x3];
      }
    }
    function penalty() {
      var s = 0, y4, x4, run, i6;
      for (var pass = 0; pass < 2; pass++) {
        for (y4 = 0; y4 < size; y4++) {
          run = 1;
          for (x4 = 1; x4 < size; x4++) {
            var cur = pass ? mod[x4][y4] : mod[y4][x4], prev = pass ? mod[x4 - 1][y4] : mod[y4][x4 - 1];
            if (cur === prev) { run++; if (run === 5) s += 3; else if (run > 5) s++; } else run = 1;
          }
        }
      }
      for (y4 = 0; y4 < size - 1; y4++) for (x4 = 0; x4 < size - 1; x4++) { var c0 = mod[y4][x4]; if (c0 === mod[y4][x4 + 1] && c0 === mod[y4 + 1][x4] && c0 === mod[y4 + 1][x4 + 1]) s += 3; }
      var pat = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
      for (y4 = 0; y4 < size; y4++) for (x4 = 0; x4 + 11 <= size; x4++) {
        var h = true, v2 = true, h2 = true, v3 = true;
        for (i6 = 0; i6 < 11; i6++) {
          h = h && (mod[y4][x4 + i6] ? 1 : 0) === pat[i6]; v2 = v2 && (mod[x4 + i6][y4] ? 1 : 0) === pat[i6];
          h2 = h2 && (mod[y4][x4 + i6] ? 1 : 0) === pat[10 - i6]; v3 = v3 && (mod[x4 + i6][y4] ? 1 : 0) === pat[10 - i6];
        }
        if (h) s += 40; if (v2) s += 40; if (h2) s += 40; if (v3) s += 40;
      }
      var dark = 0; mod.forEach(function (r) { r.forEach(function (c) { if (c) dark++; }); });
      s += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
      return s;
    }
    var best = 0, bestP = Infinity;
    for (var mk = 0; mk < 8; mk++) { applyMask(mk); formatBits(mk); var pn = penalty(); if (pn < bestP) { bestP = pn; best = mk; } applyMask(mk); }
    applyMask(best); formatBits(best);
    return mod;
  }

  function toSvg(matrix, border, label) {
    border = border == null ? 4 : border;
    var n = matrix.length, d = [];
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (matrix[y][x]) d.push('M' + (x + border) + ',' + (y + border) + 'h1v1h-1z');
    var s = n + border * 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s + '" shape-rendering="crispEdges" role="img" aria-label="' + (label || 'QR code') + '">' +
      '<rect width="100%" height="100%" fill="#fff"/><path d="' + d.join('') + '" fill="#000"/></svg>';
  }
  var api = { encode: encode, toSvg: toSvg };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RRQR = api;
})(typeof window !== 'undefined' ? window : globalThis);

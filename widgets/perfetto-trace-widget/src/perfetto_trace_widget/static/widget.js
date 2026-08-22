function L(u, t) {
  if (!u)
    throw new Error("Failed assertion");
}
function Z(u, t) {
  if (u == null)
    throw new Error("Value is null or undefined");
  return u;
}
function ae(u, t) {
  if (u)
    throw new Error("Failed assertion");
}
function K() {
  let u, t;
  const n = new Promise((l, s) => {
    u = l, t = s;
  });
  return Object.assign(n, { resolve: u, reject: t });
}
const Ct = 128 * 1024, st = 1024 * 1024 * 1024;
class ue {
  buf = new Uint8Array(Ct);
  fastpath;
  rd = 0;
  wr = 0;
  // The caller must call readMessage() after each append() call.
  append(t) {
    L(this.wr <= this.buf.length), L(this.rd <= this.wr), this.rd === this.wr && (this.rd = this.wr = 0);
    const n = t.length;
    if (n === 0) return;
    if (L(this.fastpath === void 0), this.rd === this.wr) {
      const s = this.tryReadMessage(t, 0, n);
      if (s !== void 0 && s.byteOffset + s.length === t.byteOffset + n) {
        this.fastpath = s;
        return;
      }
    }
    let l = this.buf.length - this.wr;
    if (n > l && (this.buf.copyWithin(0, this.rd, this.wr), l += this.rd, this.wr -= this.rd, this.rd = 0, n > l)) {
      let s = this.buf.length;
      for (; n > s - this.wr; )
        s += Ct;
      L(s <= st * 2);
      const r = new Uint8Array(s);
      r.set(this.buf), this.buf = r;
    }
    this.buf.set(t, this.wr), this.wr += n;
  }
  // Tries to extract a message from the ring buffer. Returns undefined if
  // there is no message, or if the current message is still incomplete.
  // The caller is expected to call this in a loop until it returns
  // undefined (a single append() can yield more than one message).
  readMessage() {
    if (this.fastpath !== void 0) {
      L(this.rd === this.wr);
      const n = this.fastpath;
      return this.fastpath = void 0, n;
    }
    if (L(this.rd <= this.wr), this.rd >= this.wr)
      return;
    const t = this.tryReadMessage(this.buf, this.rd, this.wr);
    if (t !== void 0)
      return L(t.buffer === this.buf.buffer), L(this.buf.byteOffset === 0), this.rd = t.byteOffset + t.length, t.slice();
  }
  tryReadMessage(t, n, l) {
    L(l <= t.length);
    let s = n;
    if (s >= l) return;
    let r = 0;
    const i = t[s++];
    if (i >= 128 || (i & 7) !== 2)
      throw new Error(
        `RPC framing error, unexpected tag ${i} @ offset ${s - 1}`
      );
    for (let o = 0; ; o += 7) {
      if (s >= l)
        return;
      const c = t[s++];
      if (r |= (c & 127) << o >>> 0, c < 128) break;
    }
    if (r >= st)
      throw new Error(
        `RPC framing error, message too large (${r} > ${st})`
      );
    const a = s + r;
    if (!(a > l))
      return t.subarray(s, a);
  }
}
var z = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function fe(u) {
  return u && u.__esModule && Object.prototype.hasOwnProperty.call(u, "default") ? u.default : u;
}
var ot = {}, J = {}, ht, Ot;
function le() {
  if (Ot) return ht;
  Ot = 1, ht = u;
  function u(t, n) {
    for (var l = new Array(arguments.length - 1), s = 0, r = 2, i = !0; r < arguments.length; )
      l[s++] = arguments[r++];
    return new Promise(function(o, c) {
      l[s] = function(h) {
        if (i)
          if (i = !1, h)
            c(h);
          else {
            for (var f = new Array(arguments.length - 1), d = 0; d < f.length; )
              f[d++] = arguments[d];
            o.apply(null, f);
          }
      };
      try {
        t.apply(n || null, l);
      } catch (w) {
        i && (i = !1, c(w));
      }
    });
  }
  return ht;
}
var at = {}, It;
function ce() {
  return It || (It = 1, (function(u) {
    var t = u;
    t.length = function(a) {
      var o = a.length;
      if (!o)
        return 0;
      for (var c = 0; --o % 4 > 1 && a.charAt(o) === "="; )
        ++c;
      return Math.ceil(a.length * 3) / 4 - c;
    };
    for (var n = new Array(64), l = new Array(123), s = 0; s < 64; )
      l[n[s] = s < 26 ? s + 65 : s < 52 ? s + 71 : s < 62 ? s - 4 : s - 59 | 43] = s++;
    t.encode = function(a, o, c) {
      for (var w = null, h = [], f = 0, d = 0, g; o < c; ) {
        var E = a[o++];
        switch (d) {
          case 0:
            h[f++] = n[E >> 2], g = (E & 3) << 4, d = 1;
            break;
          case 1:
            h[f++] = n[g | E >> 4], g = (E & 15) << 2, d = 2;
            break;
          case 2:
            h[f++] = n[g | E >> 6], h[f++] = n[E & 63], d = 0;
            break;
        }
        f > 8191 && ((w || (w = [])).push(String.fromCharCode.apply(String, h)), f = 0);
      }
      return d && (h[f++] = n[g], h[f++] = 61, d === 1 && (h[f++] = 61)), w ? (f && w.push(String.fromCharCode.apply(String, h.slice(0, f))), w.join("")) : String.fromCharCode.apply(String, h.slice(0, f));
    };
    var r = "invalid encoding";
    t.decode = function(a, o, c) {
      for (var w = c, h = 0, f, d = 0; d < a.length; ) {
        var g = a.charCodeAt(d++);
        if (g === 61 && h > 1)
          break;
        if ((g = l[g]) === void 0)
          throw Error(r);
        switch (h) {
          case 0:
            f = g, h = 1;
            break;
          case 1:
            o[c++] = f << 2 | (g & 48) >> 4, f = g, h = 2;
            break;
          case 2:
            o[c++] = (f & 15) << 4 | (g & 60) >> 2, f = g, h = 3;
            break;
          case 3:
            o[c++] = (f & 3) << 6 | g, h = 0;
            break;
        }
      }
      if (h === 1)
        throw Error(r);
      return c - w;
    }, t.test = function(a) {
      return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(a);
    };
  })(at)), at;
}
var ut, xt;
function ge() {
  if (xt) return ut;
  xt = 1, ut = u;
  function u() {
    this._listeners = /* @__PURE__ */ Object.create(null);
  }
  return u.prototype.on = function(n, l, s) {
    return (this._listeners[n] || (this._listeners[n] = [])).push({
      fn: l,
      ctx: s || this
    }), this;
  }, u.prototype.off = function(n, l) {
    if (n === void 0)
      this._listeners = /* @__PURE__ */ Object.create(null);
    else if (l === void 0)
      this._listeners[n] = [];
    else {
      var s = this._listeners[n];
      if (!s)
        return this;
      for (var r = 0; r < s.length; )
        s[r].fn === l ? s.splice(r, 1) : ++r;
    }
    return this;
  }, u.prototype.emit = function(n) {
    var l = this._listeners[n];
    if (l) {
      for (var s = [], r = 1; r < arguments.length; )
        s.push(arguments[r++]);
      for (r = 0; r < l.length; )
        l[r].fn.apply(l[r++].ctx, s);
    }
    return this;
  }, ut;
}
var ft, Ft;
function de() {
  if (Ft) return ft;
  Ft = 1, ft = u(u);
  function u(r) {
    return typeof Float32Array < "u" ? (function() {
      var i = new Float32Array([-0]), a = new Uint8Array(i.buffer), o = a[3] === 128;
      function c(d, g, E) {
        i[0] = d, g[E] = a[0], g[E + 1] = a[1], g[E + 2] = a[2], g[E + 3] = a[3];
      }
      function w(d, g, E) {
        i[0] = d, g[E] = a[3], g[E + 1] = a[2], g[E + 2] = a[1], g[E + 3] = a[0];
      }
      r.writeFloatLE = o ? c : w, r.writeFloatBE = o ? w : c;
      function h(d, g) {
        return a[0] = d[g], a[1] = d[g + 1], a[2] = d[g + 2], a[3] = d[g + 3], i[0];
      }
      function f(d, g) {
        return a[3] = d[g], a[2] = d[g + 1], a[1] = d[g + 2], a[0] = d[g + 3], i[0];
      }
      r.readFloatLE = o ? h : f, r.readFloatBE = o ? f : h;
    })() : (function() {
      function i(o, c, w, h) {
        var f = c < 0 ? 1 : 0;
        if (f && (c = -c), c === 0)
          o(1 / c > 0 ? (
            /* positive */
            0
          ) : (
            /* negative 0 */
            2147483648
          ), w, h);
        else if (isNaN(c))
          o(2143289344, w, h);
        else if (c > 34028234663852886e22)
          o((f << 31 | 2139095040) >>> 0, w, h);
        else if (c < 11754943508222875e-54)
          o((f << 31 | Math.round(c / 1401298464324817e-60)) >>> 0, w, h);
        else {
          var d = Math.floor(Math.log(c) / Math.LN2), g = Math.round(c * Math.pow(2, -d) * 8388608) & 8388607;
          o((f << 31 | d + 127 << 23 | g) >>> 0, w, h);
        }
      }
      r.writeFloatLE = i.bind(null, t), r.writeFloatBE = i.bind(null, n);
      function a(o, c, w) {
        var h = o(c, w), f = (h >> 31) * 2 + 1, d = h >>> 23 & 255, g = h & 8388607;
        return d === 255 ? g ? NaN : f * (1 / 0) : d === 0 ? f * 1401298464324817e-60 * g : f * Math.pow(2, d - 150) * (g + 8388608);
      }
      r.readFloatLE = a.bind(null, l), r.readFloatBE = a.bind(null, s);
    })(), typeof Float64Array < "u" ? (function() {
      var i = new Float64Array([-0]), a = new Uint8Array(i.buffer), o = a[7] === 128;
      function c(d, g, E) {
        i[0] = d, g[E] = a[0], g[E + 1] = a[1], g[E + 2] = a[2], g[E + 3] = a[3], g[E + 4] = a[4], g[E + 5] = a[5], g[E + 6] = a[6], g[E + 7] = a[7];
      }
      function w(d, g, E) {
        i[0] = d, g[E] = a[7], g[E + 1] = a[6], g[E + 2] = a[5], g[E + 3] = a[4], g[E + 4] = a[3], g[E + 5] = a[2], g[E + 6] = a[1], g[E + 7] = a[0];
      }
      r.writeDoubleLE = o ? c : w, r.writeDoubleBE = o ? w : c;
      function h(d, g) {
        return a[0] = d[g], a[1] = d[g + 1], a[2] = d[g + 2], a[3] = d[g + 3], a[4] = d[g + 4], a[5] = d[g + 5], a[6] = d[g + 6], a[7] = d[g + 7], i[0];
      }
      function f(d, g) {
        return a[7] = d[g], a[6] = d[g + 1], a[5] = d[g + 2], a[4] = d[g + 3], a[3] = d[g + 4], a[2] = d[g + 5], a[1] = d[g + 6], a[0] = d[g + 7], i[0];
      }
      r.readDoubleLE = o ? h : f, r.readDoubleBE = o ? f : h;
    })() : (function() {
      function i(o, c, w, h, f, d) {
        var g = h < 0 ? 1 : 0;
        if (g && (h = -h), h === 0)
          o(0, f, d + c), o(1 / h > 0 ? (
            /* positive */
            0
          ) : (
            /* negative 0 */
            2147483648
          ), f, d + w);
        else if (isNaN(h))
          o(0, f, d + c), o(2146959360, f, d + w);
        else if (h > 17976931348623157e292)
          o(0, f, d + c), o((g << 31 | 2146435072) >>> 0, f, d + w);
        else {
          var E;
          if (h < 22250738585072014e-324)
            E = h / 5e-324, o(E >>> 0, f, d + c), o((g << 31 | E / 4294967296) >>> 0, f, d + w);
          else {
            var b = Math.floor(Math.log(h) / Math.LN2);
            b === 1024 && (b = 1023), E = h * Math.pow(2, -b), o(E * 4503599627370496 >>> 0, f, d + c), o((g << 31 | b + 1023 << 20 | E * 1048576 & 1048575) >>> 0, f, d + w);
          }
        }
      }
      r.writeDoubleLE = i.bind(null, t, 0, 4), r.writeDoubleBE = i.bind(null, n, 4, 0);
      function a(o, c, w, h, f) {
        var d = o(h, f + c), g = o(h, f + w), E = (g >> 31) * 2 + 1, b = g >>> 20 & 2047, m = 4294967296 * (g & 1048575) + d;
        return b === 2047 ? m ? NaN : E * (1 / 0) : b === 0 ? E * 5e-324 * m : E * Math.pow(2, b - 1075) * (m + 4503599627370496);
      }
      r.readDoubleLE = a.bind(null, l, 0, 4), r.readDoubleBE = a.bind(null, s, 4, 0);
    })(), r;
  }
  function t(r, i, a) {
    i[a] = r & 255, i[a + 1] = r >>> 8 & 255, i[a + 2] = r >>> 16 & 255, i[a + 3] = r >>> 24;
  }
  function n(r, i, a) {
    i[a] = r >>> 24, i[a + 1] = r >>> 16 & 255, i[a + 2] = r >>> 8 & 255, i[a + 3] = r & 255;
  }
  function l(r, i) {
    return (r[i] | r[i + 1] << 8 | r[i + 2] << 16 | r[i + 3] << 24) >>> 0;
  }
  function s(r, i) {
    return (r[i] << 24 | r[i + 1] << 16 | r[i + 2] << 8 | r[i + 3]) >>> 0;
  }
  return ft;
}
var lt = {}, Ut;
function pe() {
  return Ut || (Ut = 1, (function(u) {
    var t = u, n = 65533;
    t.length = function(s) {
      for (var r = 0, i = 0, a = 0; a < s.length; ++a)
        i = s.charCodeAt(a), i < 128 ? r += 1 : i < 2048 ? r += 2 : (i & 64512) === 55296 && (s.charCodeAt(a + 1) & 64512) === 56320 ? (++a, r += 4) : r += 3;
      return r;
    }, t.read = function(s, r, i) {
      if (i - r < 1)
        return "";
      for (var a = null, o = [], c = 0, w, h, f, d; r < i; )
        w = s[r++], w <= 127 ? o[c++] = w : w >= 192 && w < 224 ? (f = (w & 31) << 6 | s[r++] & 63, o[c++] = f >= 128 ? f : n) : w >= 224 && w < 240 ? (d = (w & 15) << 12 | (s[r++] & 63) << 6 | s[r++] & 63, o[c++] = d >= 2048 ? d : n) : w >= 240 && (h = (w & 7) << 18 | (s[r++] & 63) << 12 | (s[r++] & 63) << 6 | s[r++] & 63, h < 65536 || h > 1114111 ? o[c++] = n : (h -= 65536, o[c++] = 55296 + (h >> 10), o[c++] = 56320 + (h & 1023))), c > 8191 && ((a || (a = [])).push(String.fromCharCode.apply(String, o.slice(0, c))), c = 0);
      return a ? (c && a.push(String.fromCharCode.apply(String, o.slice(0, c))), a.join("")) : String.fromCharCode.apply(String, o.slice(0, c));
    }, t.write = function(s, r, i) {
      for (var a = i, o, c, w = 0; w < s.length; ++w)
        o = s.charCodeAt(w), o < 128 ? r[i++] = o : o < 2048 ? (r[i++] = o >> 6 | 192, r[i++] = o & 63 | 128) : (o & 64512) === 55296 && ((c = s.charCodeAt(w + 1)) & 64512) === 56320 ? (o = 65536 + ((o & 1023) << 10) + (c & 1023), ++w, r[i++] = o >> 18 | 240, r[i++] = o >> 12 & 63 | 128, r[i++] = o >> 6 & 63 | 128, r[i++] = o & 63 | 128) : (r[i++] = o >> 12 | 224, r[i++] = o >> 6 & 63 | 128, r[i++] = o & 63 | 128);
      return i - a;
    };
  })(lt)), lt;
}
var ct, qt;
function we() {
  if (qt) return ct;
  qt = 1, ct = u;
  function u(t, n, l) {
    var s = l || 8192, r = s >>> 1, i = null, a = s;
    return function(c) {
      if (c < 1 || c > r)
        return t(c);
      a + c > s && (i = t(s), a = 0);
      var w = n.call(i, a, a += c);
      return a & 7 && (a = (a | 7) + 1), w;
    };
  }
  return ct;
}
var gt, Mt;
function ye() {
  if (Mt) return gt;
  Mt = 1, gt = t;
  var u = W();
  function t(r, i) {
    this.lo = r >>> 0, this.hi = i >>> 0;
  }
  var n = t.zero = new t(0, 0);
  n.toNumber = function() {
    return 0;
  }, n.zzEncode = n.zzDecode = function() {
    return this;
  }, n.length = function() {
    return 1;
  };
  var l = t.zeroHash = "\0\0\0\0\0\0\0\0";
  t.fromNumber = function(i) {
    if (i === 0)
      return n;
    var a = i < 0;
    a && (i = -i);
    var o = i >>> 0, c = (i - o) / 4294967296 >>> 0;
    return a && (c = ~c >>> 0, o = ~o >>> 0, ++o > 4294967295 && (o = 0, ++c > 4294967295 && (c = 0))), new t(o, c);
  }, t.from = function(i) {
    if (typeof i == "number")
      return t.fromNumber(i);
    if (u.isString(i))
      if (u.Long)
        i = u.Long.fromString(i);
      else
        return t.fromNumber(parseInt(i, 10));
    return i.low || i.high ? new t(i.low >>> 0, i.high >>> 0) : n;
  }, t.prototype.toNumber = function(i) {
    if (!i && this.hi >>> 31) {
      var a = ~this.lo + 1 >>> 0, o = ~this.hi >>> 0;
      return a || (o = o + 1 >>> 0), -(a + o * 4294967296);
    }
    return this.lo + this.hi * 4294967296;
  }, t.prototype.toLong = function(i) {
    return u.Long ? new u.Long(this.lo | 0, this.hi | 0, !!i) : { low: this.lo | 0, high: this.hi | 0, unsigned: !!i };
  };
  var s = String.prototype.charCodeAt;
  return t.fromHash = function(i) {
    return i === l ? n : new t(
      (s.call(i, 0) | s.call(i, 1) << 8 | s.call(i, 2) << 16 | s.call(i, 3) << 24) >>> 0,
      (s.call(i, 4) | s.call(i, 5) << 8 | s.call(i, 6) << 16 | s.call(i, 7) << 24) >>> 0
    );
  }, t.prototype.toHash = function() {
    return String.fromCharCode(
      this.lo & 255,
      this.lo >>> 8 & 255,
      this.lo >>> 16 & 255,
      this.lo >>> 24,
      this.hi & 255,
      this.hi >>> 8 & 255,
      this.hi >>> 16 & 255,
      this.hi >>> 24
    );
  }, t.prototype.zzEncode = function() {
    var i = this.hi >> 31;
    return this.hi = ((this.hi << 1 | this.lo >>> 31) ^ i) >>> 0, this.lo = (this.lo << 1 ^ i) >>> 0, this;
  }, t.prototype.zzDecode = function() {
    var i = -(this.lo & 1);
    return this.lo = ((this.lo >>> 1 | this.hi << 31) ^ i) >>> 0, this.hi = (this.hi >>> 1 ^ i) >>> 0, this;
  }, t.prototype.length = function() {
    var i = this.lo, a = (this.lo >>> 28 | this.hi << 4) >>> 0, o = this.hi >>> 24;
    return o === 0 ? a === 0 ? i < 16384 ? i < 128 ? 1 : 2 : i < 2097152 ? 3 : 4 : a < 16384 ? a < 128 ? 5 : 6 : a < 2097152 ? 7 : 8 : o < 128 ? 9 : 10;
  }, gt;
}
var H = { exports: {} }, me = H.exports, kt;
function _e() {
  return kt || (kt = 1, (function(u, t) {
    (function(n, l) {
      function s(r) {
        return r.default || r;
      }
      l(t), u.exports = s(t);
    })(
      typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : me,
      function(n) {
        Object.defineProperty(n, "__esModule", {
          value: !0
        }), n.default = void 0;
        var l = null;
        try {
          l = new WebAssembly.Instance(
            new WebAssembly.Module(
              new Uint8Array([
                // \0asm
                0,
                97,
                115,
                109,
                // version 1
                1,
                0,
                0,
                0,
                // section "type"
                1,
                13,
                2,
                // 0, () => i32
                96,
                0,
                1,
                127,
                // 1, (i32, i32, i32, i32) => i32
                96,
                4,
                127,
                127,
                127,
                127,
                1,
                127,
                // section "function"
                3,
                7,
                6,
                // 0, type 0
                0,
                // 1, type 1
                1,
                // 2, type 1
                1,
                // 3, type 1
                1,
                // 4, type 1
                1,
                // 5, type 1
                1,
                // section "global"
                6,
                6,
                1,
                // 0, "high", mutable i32
                127,
                1,
                65,
                0,
                11,
                // section "export"
                7,
                50,
                6,
                // 0, "mul"
                3,
                109,
                117,
                108,
                0,
                1,
                // 1, "div_s"
                5,
                100,
                105,
                118,
                95,
                115,
                0,
                2,
                // 2, "div_u"
                5,
                100,
                105,
                118,
                95,
                117,
                0,
                3,
                // 3, "rem_s"
                5,
                114,
                101,
                109,
                95,
                115,
                0,
                4,
                // 4, "rem_u"
                5,
                114,
                101,
                109,
                95,
                117,
                0,
                5,
                // 5, "get_high"
                8,
                103,
                101,
                116,
                95,
                104,
                105,
                103,
                104,
                0,
                0,
                // section "code"
                10,
                191,
                1,
                6,
                // 0, "get_high"
                4,
                0,
                35,
                0,
                11,
                // 1, "mul"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                126,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 2, "div_s"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                127,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 3, "div_u"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                128,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 4, "rem_s"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                129,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11,
                // 5, "rem_u"
                36,
                1,
                1,
                126,
                32,
                0,
                173,
                32,
                1,
                173,
                66,
                32,
                134,
                132,
                32,
                2,
                173,
                32,
                3,
                173,
                66,
                32,
                134,
                132,
                130,
                34,
                4,
                66,
                32,
                135,
                167,
                36,
                0,
                32,
                4,
                167,
                11
              ])
            ),
            {}
          ).exports;
        } catch {
        }
        function s(p, e, _) {
          this.low = p | 0, this.high = e | 0, this.unsigned = !!_;
        }
        s.prototype.__isLong__, Object.defineProperty(s.prototype, "__isLong__", {
          value: !0
        });
        function r(p) {
          return (p && p.__isLong__) === !0;
        }
        function i(p) {
          var e = Math.clz32(p & -p);
          return p ? 31 - e : e;
        }
        s.isLong = r;
        var a = {}, o = {};
        function c(p, e) {
          var _, R, A;
          return e ? (p >>>= 0, (A = 0 <= p && p < 256) && (R = o[p], R) ? R : (_ = h(p, 0, !0), A && (o[p] = _), _)) : (p |= 0, (A = -128 <= p && p < 128) && (R = a[p], R) ? R : (_ = h(p, p < 0 ? -1 : 0, !1), A && (a[p] = _), _));
        }
        s.fromInt = c;
        function w(p, e) {
          if (isNaN(p)) return e ? D : P;
          if (e) {
            if (p < 0) return D;
            if (p >= v) return St;
          } else {
            if (p <= -N) return I;
            if (p + 1 >= N) return Tt;
          }
          return p < 0 ? w(-p, e).neg() : h(
            p % m | 0,
            p / m | 0,
            e
          );
        }
        s.fromNumber = w;
        function h(p, e, _) {
          return new s(p, e, _);
        }
        s.fromBits = h;
        var f = Math.pow;
        function d(p, e, _) {
          if (p.length === 0) throw Error("empty string");
          if (typeof e == "number" ? (_ = e, e = !1) : e = !!e, p === "NaN" || p === "Infinity" || p === "+Infinity" || p === "-Infinity")
            return e ? D : P;
          if (_ = _ || 10, _ < 2 || 36 < _) throw RangeError("radix");
          var R;
          if ((R = p.indexOf("-")) > 0) throw Error("interior hyphen");
          if (R === 0)
            return d(p.substring(1), e, _).neg();
          for (var A = w(f(_, 8)), B = P, S = 0; S < p.length; S += 8) {
            var x = Math.min(8, p.length - S), U = parseInt(p.substring(S, S + x), _);
            if (x < 8) {
              var O = w(f(_, x));
              B = B.mul(O).add(w(U));
            } else
              B = B.mul(A), B = B.add(w(U));
          }
          return B.unsigned = e, B;
        }
        s.fromString = d;
        function g(p, e) {
          return typeof p == "number" ? w(p, e) : typeof p == "string" ? d(p, e) : h(
            p.low,
            p.high,
            typeof e == "boolean" ? e : p.unsigned
          );
        }
        s.fromValue = g;
        var E = 65536, b = 1 << 24, m = E * E, v = m * m, N = v / 2, k = c(b), P = c(0);
        s.ZERO = P;
        var D = c(0, !0);
        s.UZERO = D;
        var $ = c(1);
        s.ONE = $;
        var At = c(1, !0);
        s.UONE = At;
        var it = c(-1);
        s.NEG_ONE = it;
        var Tt = h(-1, 2147483647, !1);
        s.MAX_VALUE = Tt;
        var St = h(-1, -1, !0);
        s.MAX_UNSIGNED_VALUE = St;
        var I = h(0, -2147483648, !1);
        s.MIN_VALUE = I;
        var y = s.prototype;
        y.toInt = function() {
          return this.unsigned ? this.low >>> 0 : this.low;
        }, y.toNumber = function() {
          return this.unsigned ? (this.high >>> 0) * m + (this.low >>> 0) : this.high * m + (this.low >>> 0);
        }, y.toString = function(e) {
          if (e = e || 10, e < 2 || 36 < e) throw RangeError("radix");
          if (this.isZero()) return "0";
          if (this.isNegative())
            if (this.eq(I)) {
              var _ = w(e), R = this.div(_), A = R.mul(_).sub(this);
              return R.toString(e) + A.toInt().toString(e);
            } else return "-" + this.neg().toString(e);
          for (var B = w(f(e, 6), this.unsigned), S = this, x = ""; ; ) {
            var U = S.div(B), O = S.sub(U.mul(B)).toInt() >>> 0, T = O.toString(e);
            if (S = U, S.isZero()) return T + x;
            for (; T.length < 6; ) T = "0" + T;
            x = "" + T + x;
          }
        }, y.getHighBits = function() {
          return this.high;
        }, y.getHighBitsUnsigned = function() {
          return this.high >>> 0;
        }, y.getLowBits = function() {
          return this.low;
        }, y.getLowBitsUnsigned = function() {
          return this.low >>> 0;
        }, y.getNumBitsAbs = function() {
          if (this.isNegative())
            return this.eq(I) ? 64 : this.neg().getNumBitsAbs();
          for (var e = this.high != 0 ? this.high : this.low, _ = 31; _ > 0 && (e & 1 << _) == 0; _--) ;
          return this.high != 0 ? _ + 33 : _ + 1;
        }, y.isSafeInteger = function() {
          var e = this.high >> 21;
          return e ? this.unsigned ? !1 : e === -1 && !(this.low === 0 && this.high === -2097152) : !0;
        }, y.isZero = function() {
          return this.high === 0 && this.low === 0;
        }, y.eqz = y.isZero, y.isNegative = function() {
          return !this.unsigned && this.high < 0;
        }, y.isPositive = function() {
          return this.unsigned || this.high >= 0;
        }, y.isOdd = function() {
          return (this.low & 1) === 1;
        }, y.isEven = function() {
          return (this.low & 1) === 0;
        }, y.equals = function(e) {
          return r(e) || (e = g(e)), this.unsigned !== e.unsigned && this.high >>> 31 === 1 && e.high >>> 31 === 1 ? !1 : this.high === e.high && this.low === e.low;
        }, y.eq = y.equals, y.notEquals = function(e) {
          return !this.eq(
            /* validates */
            e
          );
        }, y.neq = y.notEquals, y.ne = y.notEquals, y.lessThan = function(e) {
          return this.comp(
            /* validates */
            e
          ) < 0;
        }, y.lt = y.lessThan, y.lessThanOrEqual = function(e) {
          return this.comp(
            /* validates */
            e
          ) <= 0;
        }, y.lte = y.lessThanOrEqual, y.le = y.lessThanOrEqual, y.greaterThan = function(e) {
          return this.comp(
            /* validates */
            e
          ) > 0;
        }, y.gt = y.greaterThan, y.greaterThanOrEqual = function(e) {
          return this.comp(
            /* validates */
            e
          ) >= 0;
        }, y.gte = y.greaterThanOrEqual, y.ge = y.greaterThanOrEqual, y.compare = function(e) {
          if (r(e) || (e = g(e)), this.eq(e)) return 0;
          var _ = this.isNegative(), R = e.isNegative();
          return _ && !R ? -1 : !_ && R ? 1 : this.unsigned ? e.high >>> 0 > this.high >>> 0 || e.high === this.high && e.low >>> 0 > this.low >>> 0 ? -1 : 1 : this.sub(e).isNegative() ? -1 : 1;
        }, y.comp = y.compare, y.negate = function() {
          return !this.unsigned && this.eq(I) ? I : this.not().add($);
        }, y.neg = y.negate, y.add = function(e) {
          r(e) || (e = g(e));
          var _ = this.high >>> 16, R = this.high & 65535, A = this.low >>> 16, B = this.low & 65535, S = e.high >>> 16, x = e.high & 65535, U = e.low >>> 16, O = e.low & 65535, T = 0, q = 0, C = 0, F = 0;
          return F += B + O, C += F >>> 16, F &= 65535, C += A + U, q += C >>> 16, C &= 65535, q += R + x, T += q >>> 16, q &= 65535, T += _ + S, T &= 65535, h(C << 16 | F, T << 16 | q, this.unsigned);
        }, y.subtract = function(e) {
          return r(e) || (e = g(e)), this.add(e.neg());
        }, y.sub = y.subtract, y.multiply = function(e) {
          if (this.isZero()) return this;
          if (r(e) || (e = g(e)), l) {
            var _ = l.mul(
              this.low,
              this.high,
              e.low,
              e.high
            );
            return h(_, l.get_high(), this.unsigned);
          }
          if (e.isZero()) return this.unsigned ? D : P;
          if (this.eq(I)) return e.isOdd() ? I : P;
          if (e.eq(I)) return this.isOdd() ? I : P;
          if (this.isNegative())
            return e.isNegative() ? this.neg().mul(e.neg()) : this.neg().mul(e).neg();
          if (e.isNegative())
            return this.mul(e.neg()).neg();
          if (this.lt(k) && e.lt(k))
            return w(
              this.toNumber() * e.toNumber(),
              this.unsigned
            );
          var R = this.high >>> 16, A = this.high & 65535, B = this.low >>> 16, S = this.low & 65535, x = e.high >>> 16, U = e.high & 65535, O = e.low >>> 16, T = e.low & 65535, q = 0, C = 0, F = 0, Y = 0;
          return Y += S * T, F += Y >>> 16, Y &= 65535, F += B * T, C += F >>> 16, F &= 65535, F += S * O, C += F >>> 16, F &= 65535, C += A * T, q += C >>> 16, C &= 65535, C += B * O, q += C >>> 16, C &= 65535, C += S * U, q += C >>> 16, C &= 65535, q += R * T + A * O + B * U + S * x, q &= 65535, h(F << 16 | Y, q << 16 | C, this.unsigned);
        }, y.mul = y.multiply, y.divide = function(e) {
          if (r(e) || (e = g(e)), e.isZero()) throw Error("division by zero");
          if (l) {
            if (!this.unsigned && this.high === -2147483648 && e.low === -1 && e.high === -1)
              return this;
            var _ = (this.unsigned ? l.div_u : l.div_s)(
              this.low,
              this.high,
              e.low,
              e.high
            );
            return h(_, l.get_high(), this.unsigned);
          }
          if (this.isZero()) return this.unsigned ? D : P;
          var R, A, B;
          if (this.unsigned) {
            if (e.unsigned || (e = e.toUnsigned()), e.gt(this)) return D;
            if (e.gt(this.shru(1)))
              return At;
            B = D;
          } else {
            if (this.eq(I)) {
              if (e.eq($) || e.eq(it))
                return I;
              if (e.eq(I)) return $;
              var S = this.shr(1);
              return R = S.div(e).shl(1), R.eq(P) ? e.isNegative() ? $ : it : (A = this.sub(e.mul(R)), B = R.add(A.div(e)), B);
            } else if (e.eq(I)) return this.unsigned ? D : P;
            if (this.isNegative())
              return e.isNegative() ? this.neg().div(e.neg()) : this.neg().div(e).neg();
            if (e.isNegative()) return this.div(e.neg()).neg();
            B = P;
          }
          for (A = this; A.gte(e); ) {
            R = Math.max(1, Math.floor(A.toNumber() / e.toNumber()));
            for (var x = Math.ceil(Math.log(R) / Math.LN2), U = x <= 48 ? 1 : f(2, x - 48), O = w(R), T = O.mul(e); T.isNegative() || T.gt(A); )
              R -= U, O = w(R, this.unsigned), T = O.mul(e);
            O.isZero() && (O = $), B = B.add(O), A = A.sub(T);
          }
          return B;
        }, y.div = y.divide, y.modulo = function(e) {
          if (r(e) || (e = g(e)), l) {
            var _ = (this.unsigned ? l.rem_u : l.rem_s)(
              this.low,
              this.high,
              e.low,
              e.high
            );
            return h(_, l.get_high(), this.unsigned);
          }
          return this.sub(this.div(e).mul(e));
        }, y.mod = y.modulo, y.rem = y.modulo, y.not = function() {
          return h(~this.low, ~this.high, this.unsigned);
        }, y.countLeadingZeros = function() {
          return this.high ? Math.clz32(this.high) : Math.clz32(this.low) + 32;
        }, y.clz = y.countLeadingZeros, y.countTrailingZeros = function() {
          return this.low ? i(this.low) : i(this.high) + 32;
        }, y.ctz = y.countTrailingZeros, y.and = function(e) {
          return r(e) || (e = g(e)), h(
            this.low & e.low,
            this.high & e.high,
            this.unsigned
          );
        }, y.or = function(e) {
          return r(e) || (e = g(e)), h(
            this.low | e.low,
            this.high | e.high,
            this.unsigned
          );
        }, y.xor = function(e) {
          return r(e) || (e = g(e)), h(
            this.low ^ e.low,
            this.high ^ e.high,
            this.unsigned
          );
        }, y.shiftLeft = function(e) {
          return r(e) && (e = e.toInt()), (e &= 63) === 0 ? this : e < 32 ? h(
            this.low << e,
            this.high << e | this.low >>> 32 - e,
            this.unsigned
          ) : h(0, this.low << e - 32, this.unsigned);
        }, y.shl = y.shiftLeft, y.shiftRight = function(e) {
          return r(e) && (e = e.toInt()), (e &= 63) === 0 ? this : e < 32 ? h(
            this.low >>> e | this.high << 32 - e,
            this.high >> e,
            this.unsigned
          ) : h(
            this.high >> e - 32,
            this.high >= 0 ? 0 : -1,
            this.unsigned
          );
        }, y.shr = y.shiftRight, y.shiftRightUnsigned = function(e) {
          return r(e) && (e = e.toInt()), (e &= 63) === 0 ? this : e < 32 ? h(
            this.low >>> e | this.high << 32 - e,
            this.high >>> e,
            this.unsigned
          ) : e === 32 ? h(this.high, 0, this.unsigned) : h(this.high >>> e - 32, 0, this.unsigned);
        }, y.shru = y.shiftRightUnsigned, y.shr_u = y.shiftRightUnsigned, y.rotateLeft = function(e) {
          var _;
          return r(e) && (e = e.toInt()), (e &= 63) === 0 ? this : e === 32 ? h(this.high, this.low, this.unsigned) : e < 32 ? (_ = 32 - e, h(
            this.low << e | this.high >>> _,
            this.high << e | this.low >>> _,
            this.unsigned
          )) : (e -= 32, _ = 32 - e, h(
            this.high << e | this.low >>> _,
            this.low << e | this.high >>> _,
            this.unsigned
          ));
        }, y.rotl = y.rotateLeft, y.rotateRight = function(e) {
          var _;
          return r(e) && (e = e.toInt()), (e &= 63) === 0 ? this : e === 32 ? h(this.high, this.low, this.unsigned) : e < 32 ? (_ = 32 - e, h(
            this.high << _ | this.low >>> e,
            this.low << _ | this.high >>> e,
            this.unsigned
          )) : (e -= 32, _ = 32 - e, h(
            this.low << _ | this.high >>> e,
            this.high << _ | this.low >>> e,
            this.unsigned
          ));
        }, y.rotr = y.rotateRight, y.toSigned = function() {
          return this.unsigned ? h(this.low, this.high, !1) : this;
        }, y.toUnsigned = function() {
          return this.unsigned ? this : h(this.low, this.high, !0);
        }, y.toBytes = function(e) {
          return e ? this.toBytesLE() : this.toBytesBE();
        }, y.toBytesLE = function() {
          var e = this.high, _ = this.low;
          return [
            _ & 255,
            _ >>> 8 & 255,
            _ >>> 16 & 255,
            _ >>> 24,
            e & 255,
            e >>> 8 & 255,
            e >>> 16 & 255,
            e >>> 24
          ];
        }, y.toBytesBE = function() {
          var e = this.high, _ = this.low;
          return [
            e >>> 24,
            e >>> 16 & 255,
            e >>> 8 & 255,
            e & 255,
            _ >>> 24,
            _ >>> 16 & 255,
            _ >>> 8 & 255,
            _ & 255
          ];
        }, s.fromBytes = function(e, _, R) {
          return R ? s.fromBytesLE(e, _) : s.fromBytesBE(e, _);
        }, s.fromBytesLE = function(e, _) {
          return new s(
            e[0] | e[1] << 8 | e[2] << 16 | e[3] << 24,
            e[4] | e[5] << 8 | e[6] << 16 | e[7] << 24,
            _
          );
        }, s.fromBytesBE = function(e, _) {
          return new s(
            e[4] << 24 | e[5] << 16 | e[6] << 8 | e[7],
            e[0] << 24 | e[1] << 16 | e[2] << 8 | e[3],
            _
          );
        }, typeof BigInt == "function" && (s.fromBigInt = function(e, _) {
          var R = Number(BigInt.asIntN(32, e)), A = Number(BigInt.asIntN(32, e >> BigInt(32)));
          return h(R, A, _);
        }, s.fromValue = function(e, _) {
          return typeof e == "bigint" ? s.fromBigInt(e, _) : g(e, _);
        }, y.toBigInt = function() {
          var e = BigInt(this.low >>> 0), _ = BigInt(this.unsigned ? this.high >>> 0 : this.high);
          return _ << BigInt(32) | e;
        }), n.default = s;
      }
    );
  })(H, H.exports)), H.exports;
}
var Pt;
function W() {
  return Pt || (Pt = 1, (function(u) {
    var t = u;
    t.asPromise = le(), t.base64 = ce(), t.EventEmitter = ge(), t.float = de(), t.utf8 = pe(), t.pool = we(), t.LongBits = ye();
    function n(r) {
      return r === "__proto__" || r === "prototype" || r === "constructor";
    }
    t.isUnsafeProperty = n, t.isNode = !!(typeof z < "u" && z && z.process && z.process.versions && z.process.versions.node), t.global = t.isNode && z || typeof window < "u" && window || typeof self < "u" && self || J, t.emptyArray = Object.freeze ? Object.freeze([]) : (
      /* istanbul ignore next */
      []
    ), t.emptyObject = Object.freeze ? Object.freeze({}) : (
      /* istanbul ignore next */
      {}
    ), t.isInteger = Number.isInteger || /* istanbul ignore next */
    function(i) {
      return typeof i == "number" && isFinite(i) && Math.floor(i) === i;
    }, t.isString = function(i) {
      return typeof i == "string" || i instanceof String;
    }, t.isObject = function(i) {
      return i && typeof i == "object";
    }, t.isset = /**
     * Checks if a property on a message is considered to be present.
     * @param {Object} obj Plain object or message instance
     * @param {string} prop Property name
     * @returns {boolean} `true` if considered to be present, otherwise `false`
     */
    t.isSet = function(i, a) {
      var o = i[a];
      return o != null && Object.hasOwnProperty.call(i, a) ? typeof o != "object" || (Array.isArray(o) ? o.length : Object.keys(o).length) > 0 : !1;
    }, t.Buffer = (function() {
      try {
        var r = t.global.Buffer;
        return r.prototype.utf8Write ? r : (
          /* istanbul ignore next */
          null
        );
      } catch {
        return null;
      }
    })(), t._Buffer_from = null, t._Buffer_allocUnsafe = null, t.newBuffer = function(i) {
      return typeof i == "number" ? t.Buffer ? t._Buffer_allocUnsafe(i) : new t.Array(i) : t.Buffer ? t._Buffer_from(i) : typeof Uint8Array > "u" ? i : new Uint8Array(i);
    }, t.Array = typeof Uint8Array < "u" ? Uint8Array : Array, t.Long = /* istanbul ignore next */
    t.global.dcodeIO && /* istanbul ignore next */
    t.global.dcodeIO.Long || /* istanbul ignore next */
    t.global.Long || (function() {
      try {
        var r = _e();
        return r && r.isLong ? r : null;
      } catch {
        return null;
      }
    })(), t.key2Re = /^true|false|0|1$/, t.key32Re = /^-?(?:0|[1-9][0-9]*)$/, t.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/, t.longToHash = function(i) {
      return i ? t.LongBits.from(i).toHash() : t.LongBits.zeroHash;
    }, t.longFromHash = function(i, a) {
      var o = t.LongBits.fromHash(i);
      return t.Long ? t.Long.fromBits(o.lo, o.hi, a) : o.toNumber(!!a);
    };
    function l(r) {
      var i = typeof arguments[arguments.length - 1] == "boolean", a = i ? arguments.length - 1 : arguments.length;
      i = i && arguments[arguments.length - 1];
      for (var o = 1; o < a; ++o) {
        var c = arguments[o];
        if (c)
          for (var w = Object.keys(c), h = 0; h < w.length; ++h)
            !n(w[h]) && (r[w[h]] === void 0 || !i) && (r[w[h]] = c[w[h]]);
      }
      return r;
    }
    t.merge = l, t.nestingLimit = 32, t.recursionLimit = 100, t.makeProp = function(i, a) {
      Object.defineProperty(i, a, {
        enumerable: !0,
        configurable: !0,
        writable: !0
      });
    }, t.lcFirst = function(i) {
      return i.charAt(0).toLowerCase() + i.substring(1);
    };
    function s(r) {
      function i(a, o) {
        if (!(this instanceof i))
          return new i(a, o);
        Object.defineProperty(this, "message", { get: function() {
          return a;
        } }), Error.captureStackTrace ? Error.captureStackTrace(this, i) : Object.defineProperty(this, "stack", { value: new Error().stack || "" }), o && l(this, o);
      }
      return i.prototype = Object.create(Error.prototype, {
        constructor: {
          value: i,
          writable: !0,
          enumerable: !1,
          configurable: !0
        },
        name: {
          get: function() {
            return r;
          },
          set: void 0,
          enumerable: !1,
          // configurable: false would accurately preserve the behavior of
          // the original, but I'm guessing that was not intentional.
          // For an actual error subclass, this property would
          // be configurable.
          configurable: !0
        },
        toString: {
          value: function() {
            return this.name + ": " + this.message;
          },
          writable: !0,
          enumerable: !1,
          configurable: !0
        }
      }), i;
    }
    t.newError = s, t.ProtocolError = s("ProtocolError"), t.oneOfGetter = function(i) {
      for (var a = {}, o = 0; o < i.length; ++o)
        a[i[o]] = 1;
      return function() {
        for (var c = Object.keys(this), w = c.length - 1; w > -1; --w)
          if (a[c[w]] === 1 && this[c[w]] !== void 0 && this[c[w]] !== null)
            return c[w];
      };
    }, t.oneOfSetter = function(i) {
      return function(a) {
        for (var o = 0; o < i.length; ++o)
          i[o] !== a && delete this[i[o]];
      };
    }, t.toJSONOptions = {
      longs: String,
      enums: String,
      bytes: String,
      json: !0
    }, t._configure = function() {
      var r = t.Buffer;
      if (!r) {
        t._Buffer_from = t._Buffer_allocUnsafe = null;
        return;
      }
      t._Buffer_from = r.from !== Uint8Array.from && r.from || /* istanbul ignore next */
      function(a, o) {
        return new r(a, o);
      }, t._Buffer_allocUnsafe = r.allocUnsafe || /* istanbul ignore next */
      function(a) {
        return new r(a);
      };
    };
  })(J)), J;
}
var dt, Dt;
function te() {
  if (Dt) return dt;
  Dt = 1, dt = o;
  var u = W(), t, n = u.LongBits, l = u.base64, s = u.utf8;
  function r(b, m, v) {
    this.fn = b, this.len = m, this.next = void 0, this.val = v;
  }
  function i() {
  }
  function a(b) {
    this.head = b.head, this.tail = b.tail, this.len = b.len, this.next = b.states;
  }
  function o() {
    this.len = 0, this.head = new r(i, 0, 0), this.tail = this.head, this.states = null;
  }
  var c = function() {
    return u.Buffer ? function() {
      return (o.create = function() {
        return new t();
      })();
    } : function() {
      return new o();
    };
  };
  o.create = c(), o.alloc = function(m) {
    return new u.Array(m);
  }, u.Array !== Array && (o.alloc = u.pool(o.alloc, u.Array.prototype.subarray)), o.prototype._push = function(m, v, N) {
    return this.tail = this.tail.next = new r(m, v, N), this.len += v, this;
  };
  function w(b, m, v) {
    m[v] = b & 255;
  }
  function h(b, m, v) {
    for (; b > 127; )
      m[v++] = b & 127 | 128, b >>>= 7;
    m[v] = b;
  }
  function f(b, m) {
    this.len = b, this.next = void 0, this.val = m;
  }
  f.prototype = Object.create(r.prototype), f.prototype.fn = h, o.prototype.uint32 = function(m) {
    return this.len += (this.tail = this.tail.next = new f(
      (m = m >>> 0) < 128 ? 1 : m < 16384 ? 2 : m < 2097152 ? 3 : m < 268435456 ? 4 : 5,
      m
    )).len, this;
  }, o.prototype.int32 = function(m) {
    return (m |= 0) < 0 ? this._push(d, 10, n.fromNumber(m)) : this.uint32(m);
  }, o.prototype.sint32 = function(m) {
    return this.uint32((m << 1 ^ m >> 31) >>> 0);
  };
  function d(b, m, v) {
    for (var N = b.lo, k = b.hi; k; )
      m[v++] = N & 127 | 128, N = (N >>> 7 | k << 25) >>> 0, k >>>= 7;
    for (; N > 127; )
      m[v++] = N & 127 | 128, N = N >>> 7;
    m[v++] = N;
  }
  o.prototype.uint64 = function(m) {
    var v = n.from(m);
    return this._push(d, v.length(), v);
  }, o.prototype.int64 = o.prototype.uint64, o.prototype.sint64 = function(m) {
    var v = n.from(m).zzEncode();
    return this._push(d, v.length(), v);
  }, o.prototype.bool = function(m) {
    return this._push(w, 1, m ? 1 : 0);
  };
  function g(b, m, v) {
    m[v] = b & 255, m[v + 1] = b >>> 8 & 255, m[v + 2] = b >>> 16 & 255, m[v + 3] = b >>> 24;
  }
  o.prototype.fixed32 = function(m) {
    return this._push(g, 4, m >>> 0);
  }, o.prototype.sfixed32 = o.prototype.fixed32, o.prototype.fixed64 = function(m) {
    var v = n.from(m);
    return this._push(g, 4, v.lo)._push(g, 4, v.hi);
  }, o.prototype.sfixed64 = o.prototype.fixed64, o.prototype.float = function(m) {
    return this._push(u.float.writeFloatLE, 4, m);
  }, o.prototype.double = function(m) {
    return this._push(u.float.writeDoubleLE, 8, m);
  };
  var E = u.Array.prototype.set ? function(m, v, N) {
    v.set(m, N);
  } : function(m, v, N) {
    for (var k = 0; k < m.length; ++k)
      v[N + k] = m[k];
  };
  return o.prototype.bytes = function(m) {
    var v = m.length >>> 0;
    if (!v)
      return this._push(w, 1, 0);
    if (u.isString(m)) {
      var N = o.alloc(v = l.length(m));
      l.decode(m, N, 0), m = N;
    }
    return this.uint32(v)._push(E, v, m);
  }, o.prototype.string = function(m) {
    var v = s.length(m);
    return v ? this.uint32(v)._push(s.write, v, m) : this._push(w, 1, 0);
  }, o.prototype.fork = function() {
    return this.states = new a(this), this.head = this.tail = new r(i, 0, 0), this.len = 0, this;
  }, o.prototype.reset = function() {
    return this.states ? (this.head = this.states.head, this.tail = this.states.tail, this.len = this.states.len, this.states = this.states.next) : (this.head = this.tail = new r(i, 0, 0), this.len = 0), this;
  }, o.prototype.ldelim = function() {
    var m = this.head, v = this.tail, N = this.len;
    return this.reset().uint32(N), N && (this.tail.next = m.next, this.tail = v, this.len += N), this;
  }, o.prototype.finish = function() {
    for (var m = this.head.next, v = this.constructor.alloc(this.len), N = 0; m; )
      m.fn(m.val, v, N), N += m.len, m = m.next;
    return v;
  }, o._configure = function(b) {
    t = b, o.create = c(), t._configure();
  }, dt;
}
var pt, jt;
function Ee() {
  if (jt) return pt;
  jt = 1, pt = n;
  var u = te();
  (n.prototype = Object.create(u.prototype)).constructor = n;
  var t = W();
  function n() {
    u.call(this);
  }
  n._configure = function() {
    n.alloc = t._Buffer_allocUnsafe, n.writeBytesBuffer = t.Buffer && t.Buffer.prototype instanceof Uint8Array && t.Buffer.prototype.set.name === "set" ? function(r, i, a) {
      i.set(r, a);
    } : function(r, i, a) {
      if (r.copy)
        r.copy(i, a, 0, r.length);
      else for (var o = 0; o < r.length; )
        i[a++] = r[o++];
    };
  }, n.prototype.bytes = function(r) {
    t.isString(r) && (r = t._Buffer_from(r, "base64"));
    var i = r.length >>> 0;
    return this.uint32(i), i && this._push(n.writeBytesBuffer, i, r), this;
  };
  function l(s, r, i) {
    s.length < 40 ? t.utf8.write(s, r, i) : r.utf8Write ? r.utf8Write(s, i) : r.write(s, i);
  }
  return n.prototype.string = function(r) {
    var i = t.Buffer.byteLength(r);
    return this.uint32(i), i && this._push(l, i, r), this;
  }, n._configure(), pt;
}
var wt, Wt;
function ee() {
  if (Wt) return wt;
  Wt = 1, wt = r;
  var u = W(), t, n = u.LongBits, l = u.utf8;
  function s(h, f) {
    return RangeError("index out of range: " + h.pos + " + " + (f || 1) + " > " + h.len);
  }
  function r(h) {
    this.buf = h, this.pos = 0, this.len = h.length;
  }
  var i = typeof Uint8Array < "u" ? function(f) {
    if (f instanceof Uint8Array || Array.isArray(f))
      return new r(f);
    throw Error("illegal buffer");
  } : function(f) {
    if (Array.isArray(f))
      return new r(f);
    throw Error("illegal buffer");
  }, a = function() {
    return u.Buffer ? function(d) {
      return (r.create = function(E) {
        return u.Buffer.isBuffer(E) ? new t(E) : i(E);
      })(d);
    } : i;
  };
  r.create = a(), r.prototype._slice = u.Array.prototype.subarray || /* istanbul ignore next */
  u.Array.prototype.slice, r.prototype.uint32 = /* @__PURE__ */ (function() {
    var f = 4294967295;
    return function() {
      if (f = (this.buf[this.pos] & 127) >>> 0, this.buf[this.pos++] < 128 || (f = (f | (this.buf[this.pos] & 127) << 7) >>> 0, this.buf[this.pos++] < 128) || (f = (f | (this.buf[this.pos] & 127) << 14) >>> 0, this.buf[this.pos++] < 128) || (f = (f | (this.buf[this.pos] & 127) << 21) >>> 0, this.buf[this.pos++] < 128) || (f = (f | (this.buf[this.pos] & 15) << 28) >>> 0, this.buf[this.pos++] < 128)) return f;
      if ((this.pos += 5) > this.len)
        throw this.pos = this.len, s(this, 10);
      return f;
    };
  })(), r.prototype.int32 = function() {
    return this.uint32() | 0;
  }, r.prototype.sint32 = function() {
    var f = this.uint32();
    return f >>> 1 ^ -(f & 1) | 0;
  };
  function o() {
    var h = new n(0, 0), f = 0;
    if (this.len - this.pos > 4) {
      for (; f < 4; ++f)
        if (h.lo = (h.lo | (this.buf[this.pos] & 127) << f * 7) >>> 0, this.buf[this.pos++] < 128)
          return h;
      if (h.lo = (h.lo | (this.buf[this.pos] & 127) << 28) >>> 0, h.hi = (h.hi | (this.buf[this.pos] & 127) >> 4) >>> 0, this.buf[this.pos++] < 128)
        return h;
      f = 0;
    } else {
      for (; f < 3; ++f) {
        if (this.pos >= this.len)
          throw s(this);
        if (h.lo = (h.lo | (this.buf[this.pos] & 127) << f * 7) >>> 0, this.buf[this.pos++] < 128)
          return h;
      }
      return h.lo = (h.lo | (this.buf[this.pos++] & 127) << f * 7) >>> 0, h;
    }
    if (this.len - this.pos > 4) {
      for (; f < 5; ++f)
        if (h.hi = (h.hi | (this.buf[this.pos] & 127) << f * 7 + 3) >>> 0, this.buf[this.pos++] < 128)
          return h;
    } else
      for (; f < 5; ++f) {
        if (this.pos >= this.len)
          throw s(this);
        if (h.hi = (h.hi | (this.buf[this.pos] & 127) << f * 7 + 3) >>> 0, this.buf[this.pos++] < 128)
          return h;
      }
    throw Error("invalid varint encoding");
  }
  r.prototype.bool = function() {
    return this.uint32() !== 0;
  };
  function c(h, f) {
    return (h[f - 4] | h[f - 3] << 8 | h[f - 2] << 16 | h[f - 1] << 24) >>> 0;
  }
  r.prototype.fixed32 = function() {
    if (this.pos + 4 > this.len)
      throw s(this, 4);
    return c(this.buf, this.pos += 4);
  }, r.prototype.sfixed32 = function() {
    if (this.pos + 4 > this.len)
      throw s(this, 4);
    return c(this.buf, this.pos += 4) | 0;
  };
  function w() {
    if (this.pos + 8 > this.len)
      throw s(this, 8);
    return new n(c(this.buf, this.pos += 4), c(this.buf, this.pos += 4));
  }
  return r.prototype.float = function() {
    if (this.pos + 4 > this.len)
      throw s(this, 4);
    var f = u.float.readFloatLE(this.buf, this.pos);
    return this.pos += 4, f;
  }, r.prototype.double = function() {
    if (this.pos + 8 > this.len)
      throw s(this, 4);
    var f = u.float.readDoubleLE(this.buf, this.pos);
    return this.pos += 8, f;
  }, r.prototype.bytes = function() {
    var f = this.uint32(), d = this.pos, g = this.pos + f;
    if (g > this.len)
      throw s(this, f);
    if (this.pos += f, Array.isArray(this.buf))
      return this.buf.slice(d, g);
    if (d === g) {
      var E = u.Buffer;
      return E ? E.alloc(0) : new this.buf.constructor(0);
    }
    return this._slice.call(this.buf, d, g);
  }, r.prototype.string = function() {
    var f = this.bytes();
    return l.read(f, 0, f.length);
  }, r.prototype.skip = function(f) {
    if (typeof f == "number") {
      if (this.pos + f > this.len)
        throw s(this, f);
      this.pos += f;
    } else
      do
        if (this.pos >= this.len)
          throw s(this);
      while (this.buf[this.pos++] & 128);
    return this;
  }, r.recursionLimit = u.recursionLimit, r.prototype.skipType = function(h, f) {
    if (f === void 0 && (f = 0), f > r.recursionLimit)
      throw Error("maximum nesting depth exceeded");
    switch (h) {
      case 0:
        this.skip();
        break;
      case 1:
        this.skip(8);
        break;
      case 2:
        this.skip(this.uint32());
        break;
      case 3:
        for (; (h = this.uint32() & 7) !== 4; )
          this.skipType(h, f + 1);
        break;
      case 5:
        this.skip(4);
        break;
      /* istanbul ignore next */
      default:
        throw Error("invalid wire type " + h + " at offset " + this.pos);
    }
    return this;
  }, r._configure = function(h) {
    t = h, r.create = a(), t._configure();
    var f = u.Long ? "toLong" : (
      /* istanbul ignore next */
      "toNumber"
    );
    u.merge(r.prototype, {
      int64: function() {
        return o.call(this)[f](!1);
      },
      uint64: function() {
        return o.call(this)[f](!0);
      },
      sint64: function() {
        return o.call(this).zzDecode()[f](!1);
      },
      fixed64: function() {
        return w.call(this)[f](!0);
      },
      sfixed64: function() {
        return w.call(this)[f](!1);
      }
    });
  }, wt;
}
var yt, $t;
function be() {
  if ($t) return yt;
  $t = 1, yt = n;
  var u = ee();
  (n.prototype = Object.create(u.prototype)).constructor = n;
  var t = W();
  function n(l) {
    u.call(this, l);
  }
  return n._configure = function() {
    t.Buffer && (n.prototype._slice = t.Buffer.prototype.slice);
  }, n.prototype.string = function() {
    var s = this.uint32();
    return this.buf.utf8Slice ? this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + s, this.len)) : this.buf.toString("utf-8", this.pos, this.pos = Math.min(this.pos + s, this.len));
  }, n._configure(), yt;
}
var mt = {}, _t, zt;
function ve() {
  if (zt) return _t;
  zt = 1, _t = t;
  var u = W();
  (t.prototype = Object.create(u.EventEmitter.prototype)).constructor = t;
  function t(n, l, s) {
    if (typeof n != "function")
      throw TypeError("rpcImpl must be a function");
    u.EventEmitter.call(this), this.rpcImpl = n, this.requestDelimited = !!l, this.responseDelimited = !!s;
  }
  return t.prototype.rpcCall = function n(l, s, r, i, a) {
    if (!i)
      throw TypeError("request must be specified");
    var o = this;
    if (!a)
      return u.asPromise(n, o, l, s, r, i);
    if (!o.rpcImpl) {
      setTimeout(function() {
        a(Error("already ended"));
      }, 0);
      return;
    }
    try {
      return o.rpcImpl(
        l,
        s[o.requestDelimited ? "encodeDelimited" : "encode"](i).finish(),
        function(w, h) {
          if (w)
            return o.emit("error", w, l), a(w);
          if (h === null) {
            o.end(
              /* endedByRPC */
              !0
            );
            return;
          }
          if (!(h instanceof r))
            try {
              h = r[o.responseDelimited ? "decodeDelimited" : "decode"](h);
            } catch (f) {
              return o.emit("error", f, l), a(f);
            }
          return o.emit("data", h, l), a(null, h);
        }
      );
    } catch (c) {
      o.emit("error", c, l), setTimeout(function() {
        a(c);
      }, 0);
      return;
    }
  }, t.prototype.end = function(l) {
    return this.rpcImpl && (l || this.rpcImpl(null, null, null), this.rpcImpl = null, this.emit("end").off()), this;
  }, _t;
}
var Zt;
function Re() {
  return Zt || (Zt = 1, (function(u) {
    var t = u;
    t.Service = ve();
  })(mt)), mt;
}
var Et, Vt;
function Le() {
  return Vt || (Vt = 1, Et = /* @__PURE__ */ Object.create(null)), Et;
}
var Ht;
function Ne() {
  return Ht || (Ht = 1, (function(u) {
    var t = u;
    t.build = "minimal", t.Writer = te(), t.BufferWriter = Ee(), t.Reader = ee(), t.BufferReader = be(), t.util = W(), t.rpc = Re(), t.roots = Le(), t.configure = n;
    function n() {
      t.util._configure(), t.Writer._configure(t.BufferWriter), t.Reader._configure(t.BufferReader);
    }
    n();
  })(ot)), ot;
}
var bt, Qt;
function Be() {
  return Qt || (Qt = 1, bt = Ne()), bt;
}
var Ae = Be();
const M = /* @__PURE__ */ fe(Ae);
let Gt = !1;
function Te() {
  Gt || (M.util.Long = void 0, M.configure(), Gt = !0);
}
Te();
const j = null, tt = 0, re = "str", G = 1, Rt = "str_null", ne = new Uint8Array(), Lt = new Uint8Array(), ie = 0n, Nt = 1n, X = 32n;
function Se(u, t) {
  let n = 0, l = 0, s = 0;
  if (u.length - t > 4) {
    for (; s < 4; ++s)
      if (l = (l | (u[t] & 127) << s * 7) >>> 0, u[t++] < 128) return BigInt(l);
    if (l = (l | (u[t] & 127) << 28) >>> 0, n = (n | (u[t] & 127) >> 4) >>> 0, u[t++] < 128)
      return BigInt(n) << X | BigInt(l);
    s = 0;
  } else {
    for (; s < 3; ++s) {
      if (t >= u.length) throw Error("Index out of range");
      if (l = (l | (u[t] & 127) << s * 7) >>> 0, u[t++] < 128) return BigInt(l);
    }
    return l = (l | (u[t++] & 127) << s * 7) >>> 0, BigInt(n) << X | BigInt(l);
  }
  if (u.length - t > 4) {
    for (; s < 5; ++s)
      if (n = (n | (u[t] & 127) << s * 7 + 3) >>> 0, u[t++] < 128) {
        const r = BigInt(n) << X | BigInt(l);
        return BigInt.asIntN(64, r);
      }
  } else
    for (; s < 5; ++s) {
      if (t >= u.length) throw Error("Index out of range");
      if (n = (n | (u[t] & 127) << s * 7 + 3) >>> 0, u[t++] < 128) {
        const r = BigInt(n) << X | BigInt(l);
        return BigInt.asIntN(64, r);
      }
    }
  throw Error("invalid varint encoding");
}
class se extends Error {
  queryErrorInfo;
  constructor(t, n) {
    super(t), this.queryErrorInfo = n;
  }
  toString() {
    return `${super.toString()}
Query:
${this.queryErrorInfo.query}`;
  }
}
function Yt(u) {
  switch (u) {
    case tt:
      return "NUM";
    case G:
      return "NUM_NULL";
    case re:
      return "STR";
    case Rt:
      return "STR_NULL";
    case ne:
      return "BLOB";
    case Lt:
      return "BLOB_NULL";
    case ie:
      return "LONG";
    case Nt:
      return "LONG_NULL";
    case j:
      return "UNKNOWN";
    default:
      return `INVALID(${u})`;
  }
}
function Ce(u, t) {
  switch (u) {
    case 1:
      return t === G || t === Rt || t === Lt || t === Nt || t === j;
    case 2:
      return t === tt || t === G || t === ie || t === Nt || t === j;
    case 3:
      return t === tt || t === G || t === j;
    case 4:
      return t === re || t === Rt || t === j;
    case 5:
      return t === ne || t === Lt || t === j;
    default:
      throw new Error(`Unknown CellType ${u}`);
  }
}
const Oe = [
  "UNKNOWN",
  "NULL",
  "VARINT",
  "FLOAT64",
  "STRING",
  "BLOB"
], V = 2;
class Ie {
  columnNames = [];
  _error;
  _numRows = 0;
  _isComplete = !1;
  _errorInfo;
  _elapsedTimeMs = 0;
  constructor(t) {
    this._errorInfo = t;
  }
  batches = [];
  allRowsPromise;
  isComplete() {
    return this._isComplete;
  }
  numRows() {
    return this._numRows;
  }
  error() {
    return this._error;
  }
  columns() {
    return this.columnNames;
  }
  elapsedTimeMs() {
    return this._elapsedTimeMs;
  }
  iter(t) {
    return new vt(t, this);
  }
  firstRow(t) {
    const n = new vt(t, this);
    return L(n.valid()), n;
  }
  maybeFirstRow(t) {
    const n = new vt(t, this);
    if (n.valid())
      return n;
  }
  waitAllRows() {
    return L(this.allRowsPromise === void 0), this.allRowsPromise = K(), this._isComplete && this.resolveOrReject(this.allRowsPromise, this), this.allRowsPromise;
  }
  appendResultBatch(t) {
    const n = M.Reader.create(t);
    L(n.pos === 0);
    const l = this.columnNames.length === 0, s = /* @__PURE__ */ new Set();
    for (; n.pos < n.len; ) {
      const r = n.uint32();
      switch (r >>> 3) {
        case 1: {
          L(l);
          const i = n.string();
          let a = i;
          for (let o = 1; s.has(a); ++o)
            a = `${i}_${o}`, L(o < 100);
          s.add(a), this.columnNames.push(a);
          break;
        }
        case 2: {
          const i = n.string();
          this._error = i !== void 0 && i.length ? i : void 0;
          break;
        }
        case 3: {
          const i = n.uint32(), a = t.subarray(n.pos, n.pos + i);
          n.pos += i;
          const o = new xe(a);
          this.batches.push(o), this._isComplete = o.isLastBatch;
          const c = this.columnNames.length;
          c !== 0 ? (L(o.numCells % c === 0), this._numRows += o.numCells / c) : L(o.numCells === 0);
          break;
        }
        case 7:
          this._elapsedTimeMs = n.double();
          break;
        default:
          n.skipType(r & 7);
          break;
      }
    }
    this._isComplete && this.allRowsPromise !== void 0 && this.resolveOrReject(this.allRowsPromise, this);
  }
  get errorInfo() {
    return this._errorInfo;
  }
  resolveOrReject(t, n) {
    this._error === void 0 ? t.resolve(n) : t.reject(new se(this._error, this._errorInfo));
  }
}
class xe {
  isLastBatch = !1;
  batchBytes;
  cellTypesOff = 0;
  cellTypesLen = 0;
  varintOff = 0;
  varintLen = 0;
  float64Cells = new Float64Array();
  blobCells = [];
  stringCells = [];
  constructor(t) {
    this.batchBytes = t;
    const n = M.Reader.create(t);
    L(n.pos === 0);
    const l = n.len;
    for (; n.pos < l; ) {
      const s = n.uint32();
      switch (s >>> 3) {
        case 1:
          L((s & 7) === V), this.cellTypesLen = n.uint32(), this.cellTypesOff = n.pos, n.pos += this.cellTypesLen;
          break;
        case 2: {
          L((s & 7) === V);
          const r = n.uint32();
          this.varintOff = n.pos, this.varintLen = r, L(n.buf === t), n.pos += r;
          break;
        }
        case 3: {
          L((s & 7) === V);
          const r = n.uint32();
          L(r % 8 === 0);
          const i = r / 8, a = t.byteOffset + n.pos;
          if (a % 8 === 0)
            this.float64Cells = new Float64Array(
              t.buffer,
              a,
              i
            );
          else {
            const o = t.buffer.slice(a, a + r);
            this.float64Cells = new Float64Array(o);
          }
          n.pos += r;
          break;
        }
        case 4:
          L((s & 7) === V), this.blobCells.push(new Uint8Array(n.bytes()));
          break;
        case 5: {
          L((s & 7) === V);
          const r = n.uint32();
          L(n.pos + r <= l);
          const i = t.subarray(n.pos, n.pos + r);
          this.stringCells = new TextDecoder().decode(i).split("\0"), n.pos += r;
          break;
        }
        case 6:
          this.isLastBatch = !!n.bool();
          break;
        default:
          n.skipType(s & 7);
          break;
      }
    }
  }
  get numCells() {
    return this.cellTypesLen;
  }
}
class Fe {
  rowSpec;
  rowData;
  resultObj;
  batchIdx = -1;
  batchBytes = new Uint8Array();
  columnNames = [];
  numColumns = 0;
  cellTypesEnd = -1;
  // -1 so the 1st next() hits tryMoveToNextBatch().
  float64Cells = new Float64Array();
  varIntReader = M.Reader.create(this.batchBytes);
  blobCells = [];
  stringCells = [];
  nextCellTypeOff = 0;
  nextFloat64Cell = 0;
  nextStringCell = 0;
  nextBlobCell = 0;
  isValid = !1;
  constructor(t, n, l) {
    Object.assign(this, t), this.rowData = n, this.rowSpec = { ...t }, this.resultObj = l, this.next();
  }
  valid() {
    return this.isValid;
  }
  makeError(t) {
    return new se(t, this.resultObj.errorInfo);
  }
  get(t) {
    const n = this.rowData[t];
    if (n === void 0)
      throw this.makeError(
        `Column '${t}' doesn't exist. Actual columns: [${this.columnNames.join(",")}]`
      );
    return n;
  }
  next() {
    for (; this.nextCellTypeOff + this.numColumns > this.cellTypesEnd; )
      if (L(
        this.nextCellTypeOff === this.cellTypesEnd || this.cellTypesEnd === -1
      ), !this.tryMoveToNextBatch()) {
        this.isValid = !1;
        return;
      }
    const t = this.rowData, n = this.numColumns;
    for (let l = 0; l < n; l++) {
      const s = this.batchBytes[this.nextCellTypeOff++], r = this.columnNames[l], i = this.rowSpec[r];
      switch (s) {
        case 1:
          t[r] = null;
          break;
        case 2:
          if (i === tt || i === G) {
            const a = this.varIntReader.int64();
            t[r] = a;
          } else {
            const a = Se(
              this.batchBytes,
              this.varIntReader.pos
            );
            t[r] = a, this.varIntReader.skip();
          }
          break;
        case 3:
          t[r] = this.float64Cells[this.nextFloat64Cell++];
          break;
        case 4:
          t[r] = this.stringCells[this.nextStringCell++];
          break;
        case 5:
          t[r] = this.blobCells[this.nextBlobCell++];
          break;
        default:
          throw this.makeError(`Invalid cell type ${s}`);
      }
    }
    this.isValid = !0;
  }
  tryMoveToNextBatch() {
    const t = this.batchIdx + 1;
    if (t >= this.resultObj.batches.length)
      return !1;
    this.columnNames = this.resultObj.columnNames, this.numColumns = this.columnNames.length, this.batchIdx = t;
    const n = Z(this.resultObj.batches[t]);
    this.batchBytes = n.batchBytes, this.nextCellTypeOff = n.cellTypesOff, this.cellTypesEnd = n.cellTypesOff + n.cellTypesLen, this.float64Cells = n.float64Cells, this.blobCells = n.blobCells, this.stringCells = n.stringCells, this.varIntReader = M.Reader.create(n.batchBytes), this.varIntReader.pos = n.varintOff, this.varIntReader.len = n.varintOff + n.varintLen, this.nextFloat64Cell = 0, this.nextStringCell = 0, this.nextBlobCell = 0;
    for (const s of Object.keys(this.rowSpec))
      if (this.columnNames.indexOf(s) < 0)
        throw this.makeError(
          `Column ${s} not found in the SQL result set {${this.columnNames.join(" ")}}`
        );
    const l = this.numColumns;
    if (n.numCells === 0)
      return L(n.isLastBatch), !1;
    L(l > 0);
    for (let s = this.nextCellTypeOff; s < this.cellTypesEnd; s++) {
      const r = (s - this.nextCellTypeOff) % l, i = this.columnNames[r], a = this.batchBytes[s], o = this.rowSpec[i];
      if (o === void 0) continue;
      let c = "";
      if (Ce(a, o) || (a === 1 ? c = `SQL value is NULL but that was not expected (expected type: ${Yt(o)}). Did you mean NUM_NULL, LONG_NULL, STR_NULL or BLOB_NULL?` : c = `Incompatible cell type. Expected: ${Yt(
        o
      )} actual: ${Oe[a]}`), c.length > 0) {
        const w = Math.floor(s / l);
        throw this.makeError(`Error @ row: ${w} col: '${i}': ${c}`);
      }
    }
    return !0;
  }
}
class vt {
  _impl;
  next;
  valid;
  get;
  constructor(t, n) {
    const l = this;
    Object.assign(l, t), this._impl = new Fe(t, l, n), this.next = this._impl.next.bind(this._impl), this.valid = this._impl.valid.bind(this._impl), this.get = this._impl.get.bind(this._impl);
  }
}
class Ue {
  impl;
  thenCalled = !1;
  constructor(t) {
    this.impl = new Ie(t);
  }
  iter(t) {
    return this.impl.iter(t);
  }
  firstRow(t) {
    return this.impl.firstRow(t);
  }
  maybeFirstRow(t) {
    return this.impl.maybeFirstRow(t);
  }
  waitAllRows() {
    return this.impl.waitAllRows();
  }
  isComplete() {
    return this.impl.isComplete();
  }
  numRows() {
    return this.impl.numRows();
  }
  columns() {
    return this.impl.columns();
  }
  error() {
    return this.impl.error();
  }
  elapsedTimeMs() {
    return this.impl.elapsedTimeMs();
  }
  appendResultBatch(t) {
    return this.impl.appendResultBatch(t);
  }
  ensureAllRowsPromise() {
    return this.impl.waitAllRows();
  }
  then(t, n) {
    return ae(this.thenCalled), this.thenCalled = !0, this.ensureAllRowsPromise().then(t, n);
  }
}
function qe(u) {
  return new Ue(u);
}
var Q = /* @__PURE__ */ ((u) => (u[u.TPM_UNSPECIFIED = 0] = "TPM_UNSPECIFIED", u[u.TPM_APPEND_TRACE_DATA = 1] = "TPM_APPEND_TRACE_DATA", u[u.TPM_FINALIZE_TRACE_DATA = 2] = "TPM_FINALIZE_TRACE_DATA", u[u.TPM_QUERY_STREAMING = 3] = "TPM_QUERY_STREAMING", u[u.TPM_RESET_TRACE_PROCESSOR = 11] = "TPM_RESET_TRACE_PROCESSOR", u))(Q || {});
const et = 1, rt = 2, Me = 3, ke = 5, Pe = 101, De = 103, je = 107, We = 201, $e = 203, ze = 212, Ze = 1, Ve = 2, He = 1;
function nt(u) {
  const t = new M.Writer();
  return t.uint32(10).bytes(u), t.finish();
}
function Qe(u, t) {
  const n = new M.Writer();
  return n.uint32(et << 3 | 0).int64(u), n.uint32(rt << 3 | 0).int32(
    1
    /* TPM_APPEND_TRACE_DATA */
  ), n.uint32(Pe << 3 | 2).bytes(t), nt(n.finish());
}
function Ge(u) {
  const t = new M.Writer();
  return t.uint32(et << 3 | 0).int64(u), t.uint32(rt << 3 | 0).int32(
    2
    /* TPM_FINALIZE_TRACE_DATA */
  ), nt(t.finish());
}
function Ye(u) {
  const t = new M.Writer();
  return t.uint32(et << 3 | 0).int64(u), t.uint32(rt << 3 | 0).int32(
    11
    /* TPM_RESET_TRACE_PROCESSOR */
  ), t.uint32(je << 3 | 2).fork().ldelim(), nt(t.finish());
}
function Je(u, t) {
  const n = new M.Writer();
  return n.uint32(et << 3 | 0).int64(u), n.uint32(rt << 3 | 0).int32(
    3
    /* TPM_QUERY_STREAMING */
  ), n.uint32(De << 3 | 2).fork(), n.uint32(Ze << 3 | 2).string(t), n.ldelim(), nt(n.finish());
}
function Jt(u, t, n) {
  let l;
  for (; u.pos < t; ) {
    const s = u.uint32();
    s >>> 3 === n ? l = u.string() : u.skipType(s & 7);
  }
  return l !== void 0 && l.length > 0 ? l : void 0;
}
function Xe(u) {
  const t = M.Reader.create(u), n = { response: void 0 };
  for (; t.pos < t.len; ) {
    const l = t.uint32();
    switch (l >>> 3) {
      case Me:
        n.response = t.int32();
        break;
      case ke:
        n.fatalError = t.string();
        break;
      case We: {
        const r = t.uint32(), i = t.pos + r;
        n.error = Jt(t, i, Ve), t.pos = i;
        break;
      }
      case ze: {
        const r = t.uint32(), i = t.pos + r;
        n.error = Jt(t, i, He), t.pos = i;
        break;
      }
      case $e: {
        const r = t.uint32();
        n.queryResultBytes = u.subarray(t.pos, t.pos + r), t.pos += r;
        break;
      }
      default:
        t.skipType(l & 7);
        break;
    }
  }
  return n;
}
class Ke {
  txSeqId = 0;
  rxBuf = new ue();
  pendingParses = [];
  pendingEOFs = [];
  pendingResets = [];
  pendingQueries = [];
  _failed;
  // Called by the concrete engine when inbound bytes arrive (onmessage).
  onRpcResponseBytes(t) {
    for (this.rxBuf.append(t); ; ) {
      const n = this.rxBuf.readMessage();
      if (n === void 0) break;
      this.onRpcResponseMessage(n);
    }
  }
  onRpcResponseMessage(t) {
    const n = Xe(t);
    if (n.fatalError !== void 0 && n.fatalError.length > 0)
      throw this._failed = n.fatalError, new Error(n.fatalError);
    switch (n.response) {
      case Q.TPM_APPEND_TRACE_DATA: {
        const l = Z(this.pendingParses.shift());
        n.error !== void 0 ? l.reject(new Error(n.error)) : l.resolve();
        break;
      }
      case Q.TPM_FINALIZE_TRACE_DATA: {
        const l = Z(this.pendingEOFs.shift());
        n.error !== void 0 ? l.reject(new Error(n.error)) : l.resolve();
        break;
      }
      case Q.TPM_RESET_TRACE_PROCESSOR:
        Z(this.pendingResets.shift()).resolve();
        break;
      case Q.TPM_QUERY_STREAMING: {
        const l = Z(n.queryResultBytes), s = Z(this.pendingQueries[0]);
        s.appendResultBatch(l), s.isComplete() && this.pendingQueries.shift();
        break;
      }
      default:
        console.warn("Unexpected TraceProcessor response:", n.response);
        break;
    }
  }
  // Push trace data into the engine. It auto-detects the trace type.
  parse(t) {
    const n = K();
    return this.pendingParses.push(n), this.rpcSendRequestBytes(Qe(this.txSeqId++, t)), n;
  }
  // Notify the engine that we reached the end of the trace. Call after the
  // last parse().
  notifyEof() {
    const t = K();
    return this.pendingEOFs.push(t), this.rpcSendRequestBytes(Ge(this.txSeqId++)), t;
  }
  // Creates the TraceProcessor instance (with default options). Must be
  // called once before the first parse().
  resetTraceProcessor() {
    const t = K();
    return this.pendingResets.push(t), this.rpcSendRequestBytes(Ye(this.txSeqId++)), t;
  }
  // Issues a query and returns once all result rows have been received.
  // Rejects with a QueryError (see query_result.ts) if the query fails.
  async query(t) {
    const n = qe({ query: t });
    return this.pendingQueries.push(n), this.rpcSendRequestBytes(Je(this.txSeqId++, t)), await n;
  }
  get failed() {
    return this._failed;
  }
}
const oe = '(function(){"use strict";function l(r,t){if(!r)throw new Error("Failed assertion")}function c(r,t){if(r==null)throw new Error(t??"Value is null or undefined");return r}const u=32*1024*1024;class f{aborted=!1;connection;reqBufferAddr=0;lastStderr=[];messagePort;async initialize(t,o,e){l(this.messagePort===void 0),this.messagePort=t;const a=await(await this.loadModuleFactory(o))({locateFile:n=>n,print:n=>console.log(n),printErr:n=>this.appendAndLogErr(n),instantiateWasm:(n,i)=>{const h=new WebAssembly.Instance(e,n);return i(h,e),h.exports}}),d=a.addFunction(this.onReply.bind(this),"vpi");this.reqBufferAddr=Number(a.ccall("trace_processor_rpc_init","pointer",["pointer","number"],[d,u]))>>>0,this.connection=a,t.onmessage=this.onMessage.bind(this)}async loadModuleFactory(t){const o=await(await fetch(t)).text(),e={exports:{}};return new Function("module","exports",o)(e,e.exports),c(e.exports.default,`${t} did not assign module.exports.default — its UMD wrapper may have changed`)}onMessage(t){if(this.aborted)throw new Error("Wasm module crashed");const o=c(this.connection);l(t.data instanceof Uint8Array);const e=t.data;let s=0;for(;s<e.length;){const a=Math.min(e.length-s,u),d=e.subarray(s,s+a);o.HEAPU8.set(d,this.reqBufferAddr),s+=a;try{o.ccall("trace_processor_on_rpc_request","void",["number"],[a])}catch(n){this.aborted=!0;let i=`${n}`;throw n instanceof Error&&(i=`${n.name}: ${n.message}\n${n.stack}`),i+=`\n\nstderr: \n`+this.lastStderr.join(`\n`),new Error(i)}}}onReply(t,o){const e=t>>>0,s=c(this.connection).HEAPU8.slice(e,e+o);c(this.messagePort).postMessage(s,[s.buffer])}appendAndLogErr(t){console.warn(t),this.lastStderr.push(t),this.lastStderr.length>512&&this.lastStderr.shift()}}const p=self,m=new f;p.onmessage=r=>{const t=r.data;m.initialize(t.port,t.wasmJsUrl,t.wasmModule)}})();\n', Xt = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", oe], { type: "text/javascript;charset=utf-8" });
function tr(u) {
  let t;
  try {
    if (t = Xt && (self.URL || self.webkitURL).createObjectURL(Xt), !t) throw "";
    const n = new Worker(t, {
      name: u?.name
    });
    return n.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(t);
    }), n;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(oe),
      {
        name: u?.name
      }
    );
  }
}
const he = "https://ron-devel.github.io/perfetto-wasm/";
class er extends Error {
  constructor(t) {
    super("Failed to load trace_processor.wasm.", { cause: t }), this.name = "EngineNotReadyError";
  }
}
function Kt(u, t) {
  const n = u.endsWith("/") ? u : `${u}/`;
  return new URL(t, n).href;
}
class Bt extends Ke {
  port;
  worker;
  constructor(t, n) {
    super(), this.port = t, this.worker = n, this.port.onmessage = this.onMessage.bind(this);
  }
  static async create(t) {
    const n = await WebAssembly.compileStreaming(
      fetch(Kt(t, "trace_processor.wasm"))
    ), l = new tr(), s = new MessageChannel();
    return l.postMessage(
      {
        port: s.port1,
        wasmModule: n,
        wasmJsUrl: Kt(t, "trace_processor.js")
      },
      [s.port1]
    ), new Bt(s.port2, l);
  }
  onMessage(t) {
    L(t.data instanceof Uint8Array), this.onRpcResponseBytes(t.data);
  }
  rpcSendRequestBytes(t) {
    this.port.postMessage(t);
  }
  dispose() {
    this.worker.terminate();
  }
}
async function rr(u) {
  const t = u?.wasmBaseUrl ?? he;
  let n;
  try {
    n = await Bt.create(t);
  } catch (l) {
    throw new er(l);
  }
  return await n.resetTraceProcessor(), {
    parse: (l) => n.parse(l),
    notifyEof: () => n.notifyEof(),
    async query(l) {
      const s = await n.query(l), r = s.columns(), i = {};
      for (const o of r) i[o] = j;
      const a = r.map(() => []);
      for (const o = s.iter(i); o.valid(); o.next())
        r.forEach((c, w) => a[w].push(o.get(c)));
      return {
        columns: r.map((o, c) => ({ name: o, values: a[c] })),
        rowCount: s.numRows()
      };
    },
    dispose: () => n.dispose()
  };
}
function nr(u) {
  let t;
  for (const n of u) {
    if (n === null) continue;
    const l = typeof n == "bigint" ? "int64" : typeof n == "number" ? "float64" : typeof n == "string" ? "string" : n instanceof Uint8Array ? "bytes" : "object";
    if (t === void 0) t = l;
    else if (t !== l) return "object";
  }
  return t ?? "object";
}
function ir(u) {
  return u.map((t) => ({
    name: t.name,
    dtype: nr(t.values),
    values: t.values.map(
      (n) => typeof n == "bigint" ? n.toString() : n instanceof Uint8Array ? Array.from(n) : n
    )
  }));
}
function sr({ model: u, el: t }) {
  let n;
  const l = document.createElement("div");
  l.style.fontFamily = "system-ui, sans-serif", l.style.fontSize = "0.9em";
  const s = document.createElement("input");
  s.type = "file", s.accept = ".perfetto_trace,.pftrace,.json,.gz";
  const r = document.createElement("div");
  r.style.marginTop = "0.5em", r.style.color = "#555", r.textContent = "Pick a trace file to begin.", l.append(s, r), t.appendChild(l);
  function i(h) {
    r.textContent = h, u.set("status", h), u.save_changes();
  }
  function a(h) {
    u.set("error", h instanceof Error ? h.message : String(h)), u.save_changes();
  }
  async function o() {
    if (n === void 0) {
      const h = u.get("wasm_base_url") || he;
      n = await rr({ wasmBaseUrl: h });
    }
    return n;
  }
  s.addEventListener("change", async () => {
    const h = s.files?.[0];
    if (h) {
      i(`Loading ${h.name}…`);
      try {
        const f = await o(), d = new Uint8Array(await h.arrayBuffer());
        await f.parse(d), await f.notifyEof(), i(`Loaded ${h.name}. Call run_query() from Python to query it.`), u.set("error", ""), u.save_changes();
      } catch (f) {
        i("Failed to load trace — see .error"), a(f);
      }
    }
  });
  function c(h, f) {
    const d = JSON.parse(u.get("results_json") || "{}");
    d[h] = f, u.set("results_json", JSON.stringify(d)), u.save_changes();
  }
  async function w(h, f) {
    i(`Running ${h}…`);
    try {
      const g = await (await o()).query(f);
      c(h, {
        columns: ir(g.columns),
        row_count: g.rowCount,
        error: null
      }), i(`${h}: ${g.rowCount} row(s).`);
    } catch (d) {
      c(h, {
        columns: [],
        row_count: 0,
        error: d instanceof Error ? d.message : String(d)
      }), i(`${h}: failed — see its result's "error".`);
    }
  }
  return u.on("msg:custom", (h) => {
    const f = h;
    f.type === "run_query" && f.query_id && f.sql !== void 0 && w(f.query_id, f.sql);
  }), () => {
    n?.dispose();
  };
}
const or = { render: sr };
export {
  or as default
};

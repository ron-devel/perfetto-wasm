function L(a, t) {
  if (!a)
    throw new Error("Failed assertion");
}
function Z(a, t) {
  if (a == null)
    throw new Error("Value is null or undefined");
  return a;
}
function ae(a, t) {
  if (a)
    throw new Error("Failed assertion");
}
function K() {
  let a, t;
  const i = new Promise((l, s) => {
    a = l, t = s;
  });
  return Object.assign(i, { resolve: a, reject: t });
}
const Ot = 128 * 1024, st = 1024 * 1024 * 1024;
class ue {
  buf = new Uint8Array(Ot);
  fastpath;
  rd = 0;
  wr = 0;
  // The caller must call readMessage() after each append() call.
  append(t) {
    L(this.wr <= this.buf.length), L(this.rd <= this.wr), this.rd === this.wr && (this.rd = this.wr = 0);
    const i = t.length;
    if (i === 0) return;
    if (L(this.fastpath === void 0), this.rd === this.wr) {
      const s = this.tryReadMessage(t, 0, i);
      if (s !== void 0 && s.byteOffset + s.length === t.byteOffset + i) {
        this.fastpath = s;
        return;
      }
    }
    let l = this.buf.length - this.wr;
    if (i > l && (this.buf.copyWithin(0, this.rd, this.wr), l += this.rd, this.wr -= this.rd, this.rd = 0, i > l)) {
      let s = this.buf.length;
      for (; i > s - this.wr; )
        s += Ot;
      L(s <= st * 2);
      const r = new Uint8Array(s);
      r.set(this.buf), this.buf = r;
    }
    this.buf.set(t, this.wr), this.wr += i;
  }
  // Tries to extract a message from the ring buffer. Returns undefined if
  // there is no message, or if the current message is still incomplete.
  // The caller is expected to call this in a loop until it returns
  // undefined (a single append() can yield more than one message).
  readMessage() {
    if (this.fastpath !== void 0) {
      L(this.rd === this.wr);
      const i = this.fastpath;
      return this.fastpath = void 0, i;
    }
    if (L(this.rd <= this.wr), this.rd >= this.wr)
      return;
    const t = this.tryReadMessage(this.buf, this.rd, this.wr);
    if (t !== void 0)
      return L(t.buffer === this.buf.buffer), L(this.buf.byteOffset === 0), this.rd = t.byteOffset + t.length, t.slice();
  }
  tryReadMessage(t, i, l) {
    L(l <= t.length);
    let s = i;
    if (s >= l) return;
    let r = 0;
    const n = t[s++];
    if (n >= 128 || (n & 7) !== 2)
      throw new Error(
        `RPC framing error, unexpected tag ${n} @ offset ${s - 1}`
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
    const h = s + r;
    if (!(h > l))
      return t.subarray(s, h);
  }
}
var z = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function fe(a) {
  return a && a.__esModule && Object.prototype.hasOwnProperty.call(a, "default") ? a.default : a;
}
var ot = {}, X = {}, ht, It;
function le() {
  if (It) return ht;
  It = 1, ht = a;
  function a(t, i) {
    for (var l = new Array(arguments.length - 1), s = 0, r = 2, n = !0; r < arguments.length; )
      l[s++] = arguments[r++];
    return new Promise(function(o, c) {
      l[s] = function(u) {
        if (n)
          if (n = !1, u)
            c(u);
          else {
            for (var f = new Array(arguments.length - 1), w = 0; w < f.length; )
              f[w++] = arguments[w];
            o.apply(null, f);
          }
      };
      try {
        t.apply(i || null, l);
      } catch (d) {
        n && (n = !1, c(d));
      }
    });
  }
  return ht;
}
var at = {}, Ct;
function ce() {
  return Ct || (Ct = 1, (function(a) {
    var t = a;
    t.length = function(h) {
      var o = h.length;
      if (!o)
        return 0;
      for (var c = 0; --o % 4 > 1 && h.charAt(o) === "="; )
        ++c;
      return Math.ceil(h.length * 3) / 4 - c;
    };
    for (var i = new Array(64), l = new Array(123), s = 0; s < 64; )
      l[i[s] = s < 26 ? s + 65 : s < 52 ? s + 71 : s < 62 ? s - 4 : s - 59 | 43] = s++;
    t.encode = function(h, o, c) {
      for (var d = null, u = [], f = 0, w = 0, g; o < c; ) {
        var E = h[o++];
        switch (w) {
          case 0:
            u[f++] = i[E >> 2], g = (E & 3) << 4, w = 1;
            break;
          case 1:
            u[f++] = i[g | E >> 4], g = (E & 15) << 2, w = 2;
            break;
          case 2:
            u[f++] = i[g | E >> 6], u[f++] = i[E & 63], w = 0;
            break;
        }
        f > 8191 && ((d || (d = [])).push(String.fromCharCode.apply(String, u)), f = 0);
      }
      return w && (u[f++] = i[g], u[f++] = 61, w === 1 && (u[f++] = 61)), d ? (f && d.push(String.fromCharCode.apply(String, u.slice(0, f))), d.join("")) : String.fromCharCode.apply(String, u.slice(0, f));
    };
    var r = "invalid encoding";
    t.decode = function(h, o, c) {
      for (var d = c, u = 0, f, w = 0; w < h.length; ) {
        var g = h.charCodeAt(w++);
        if (g === 61 && u > 1)
          break;
        if ((g = l[g]) === void 0)
          throw Error(r);
        switch (u) {
          case 0:
            f = g, u = 1;
            break;
          case 1:
            o[c++] = f << 2 | (g & 48) >> 4, f = g, u = 2;
            break;
          case 2:
            o[c++] = (f & 15) << 4 | (g & 60) >> 2, f = g, u = 3;
            break;
          case 3:
            o[c++] = (f & 3) << 6 | g, u = 0;
            break;
        }
      }
      if (u === 1)
        throw Error(r);
      return c - d;
    }, t.test = function(h) {
      return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(h);
    };
  })(at)), at;
}
var ut, xt;
function ge() {
  if (xt) return ut;
  xt = 1, ut = a;
  function a() {
    this._listeners = /* @__PURE__ */ Object.create(null);
  }
  return a.prototype.on = function(i, l, s) {
    return (this._listeners[i] || (this._listeners[i] = [])).push({
      fn: l,
      ctx: s || this
    }), this;
  }, a.prototype.off = function(i, l) {
    if (i === void 0)
      this._listeners = /* @__PURE__ */ Object.create(null);
    else if (l === void 0)
      this._listeners[i] = [];
    else {
      var s = this._listeners[i];
      if (!s)
        return this;
      for (var r = 0; r < s.length; )
        s[r].fn === l ? s.splice(r, 1) : ++r;
    }
    return this;
  }, a.prototype.emit = function(i) {
    var l = this._listeners[i];
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
  Ft = 1, ft = a(a);
  function a(r) {
    return typeof Float32Array < "u" ? (function() {
      var n = new Float32Array([-0]), h = new Uint8Array(n.buffer), o = h[3] === 128;
      function c(w, g, E) {
        n[0] = w, g[E] = h[0], g[E + 1] = h[1], g[E + 2] = h[2], g[E + 3] = h[3];
      }
      function d(w, g, E) {
        n[0] = w, g[E] = h[3], g[E + 1] = h[2], g[E + 2] = h[1], g[E + 3] = h[0];
      }
      r.writeFloatLE = o ? c : d, r.writeFloatBE = o ? d : c;
      function u(w, g) {
        return h[0] = w[g], h[1] = w[g + 1], h[2] = w[g + 2], h[3] = w[g + 3], n[0];
      }
      function f(w, g) {
        return h[3] = w[g], h[2] = w[g + 1], h[1] = w[g + 2], h[0] = w[g + 3], n[0];
      }
      r.readFloatLE = o ? u : f, r.readFloatBE = o ? f : u;
    })() : (function() {
      function n(o, c, d, u) {
        var f = c < 0 ? 1 : 0;
        if (f && (c = -c), c === 0)
          o(1 / c > 0 ? (
            /* positive */
            0
          ) : (
            /* negative 0 */
            2147483648
          ), d, u);
        else if (isNaN(c))
          o(2143289344, d, u);
        else if (c > 34028234663852886e22)
          o((f << 31 | 2139095040) >>> 0, d, u);
        else if (c < 11754943508222875e-54)
          o((f << 31 | Math.round(c / 1401298464324817e-60)) >>> 0, d, u);
        else {
          var w = Math.floor(Math.log(c) / Math.LN2), g = Math.round(c * Math.pow(2, -w) * 8388608) & 8388607;
          o((f << 31 | w + 127 << 23 | g) >>> 0, d, u);
        }
      }
      r.writeFloatLE = n.bind(null, t), r.writeFloatBE = n.bind(null, i);
      function h(o, c, d) {
        var u = o(c, d), f = (u >> 31) * 2 + 1, w = u >>> 23 & 255, g = u & 8388607;
        return w === 255 ? g ? NaN : f * (1 / 0) : w === 0 ? f * 1401298464324817e-60 * g : f * Math.pow(2, w - 150) * (g + 8388608);
      }
      r.readFloatLE = h.bind(null, l), r.readFloatBE = h.bind(null, s);
    })(), typeof Float64Array < "u" ? (function() {
      var n = new Float64Array([-0]), h = new Uint8Array(n.buffer), o = h[7] === 128;
      function c(w, g, E) {
        n[0] = w, g[E] = h[0], g[E + 1] = h[1], g[E + 2] = h[2], g[E + 3] = h[3], g[E + 4] = h[4], g[E + 5] = h[5], g[E + 6] = h[6], g[E + 7] = h[7];
      }
      function d(w, g, E) {
        n[0] = w, g[E] = h[7], g[E + 1] = h[6], g[E + 2] = h[5], g[E + 3] = h[4], g[E + 4] = h[3], g[E + 5] = h[2], g[E + 6] = h[1], g[E + 7] = h[0];
      }
      r.writeDoubleLE = o ? c : d, r.writeDoubleBE = o ? d : c;
      function u(w, g) {
        return h[0] = w[g], h[1] = w[g + 1], h[2] = w[g + 2], h[3] = w[g + 3], h[4] = w[g + 4], h[5] = w[g + 5], h[6] = w[g + 6], h[7] = w[g + 7], n[0];
      }
      function f(w, g) {
        return h[7] = w[g], h[6] = w[g + 1], h[5] = w[g + 2], h[4] = w[g + 3], h[3] = w[g + 4], h[2] = w[g + 5], h[1] = w[g + 6], h[0] = w[g + 7], n[0];
      }
      r.readDoubleLE = o ? u : f, r.readDoubleBE = o ? f : u;
    })() : (function() {
      function n(o, c, d, u, f, w) {
        var g = u < 0 ? 1 : 0;
        if (g && (u = -u), u === 0)
          o(0, f, w + c), o(1 / u > 0 ? (
            /* positive */
            0
          ) : (
            /* negative 0 */
            2147483648
          ), f, w + d);
        else if (isNaN(u))
          o(0, f, w + c), o(2146959360, f, w + d);
        else if (u > 17976931348623157e292)
          o(0, f, w + c), o((g << 31 | 2146435072) >>> 0, f, w + d);
        else {
          var E;
          if (u < 22250738585072014e-324)
            E = u / 5e-324, o(E >>> 0, f, w + c), o((g << 31 | E / 4294967296) >>> 0, f, w + d);
          else {
            var b = Math.floor(Math.log(u) / Math.LN2);
            b === 1024 && (b = 1023), E = u * Math.pow(2, -b), o(E * 4503599627370496 >>> 0, f, w + c), o((g << 31 | b + 1023 << 20 | E * 1048576 & 1048575) >>> 0, f, w + d);
          }
        }
      }
      r.writeDoubleLE = n.bind(null, t, 0, 4), r.writeDoubleBE = n.bind(null, i, 4, 0);
      function h(o, c, d, u, f) {
        var w = o(u, f + c), g = o(u, f + d), E = (g >> 31) * 2 + 1, b = g >>> 20 & 2047, m = 4294967296 * (g & 1048575) + w;
        return b === 2047 ? m ? NaN : E * (1 / 0) : b === 0 ? E * 5e-324 * m : E * Math.pow(2, b - 1075) * (m + 4503599627370496);
      }
      r.readDoubleLE = h.bind(null, l, 0, 4), r.readDoubleBE = h.bind(null, s, 4, 0);
    })(), r;
  }
  function t(r, n, h) {
    n[h] = r & 255, n[h + 1] = r >>> 8 & 255, n[h + 2] = r >>> 16 & 255, n[h + 3] = r >>> 24;
  }
  function i(r, n, h) {
    n[h] = r >>> 24, n[h + 1] = r >>> 16 & 255, n[h + 2] = r >>> 8 & 255, n[h + 3] = r & 255;
  }
  function l(r, n) {
    return (r[n] | r[n + 1] << 8 | r[n + 2] << 16 | r[n + 3] << 24) >>> 0;
  }
  function s(r, n) {
    return (r[n] << 24 | r[n + 1] << 16 | r[n + 2] << 8 | r[n + 3]) >>> 0;
  }
  return ft;
}
var lt = {}, Ut;
function pe() {
  return Ut || (Ut = 1, (function(a) {
    var t = a, i = 65533;
    t.length = function(s) {
      for (var r = 0, n = 0, h = 0; h < s.length; ++h)
        n = s.charCodeAt(h), n < 128 ? r += 1 : n < 2048 ? r += 2 : (n & 64512) === 55296 && (s.charCodeAt(h + 1) & 64512) === 56320 ? (++h, r += 4) : r += 3;
      return r;
    }, t.read = function(s, r, n) {
      if (n - r < 1)
        return "";
      for (var h = null, o = [], c = 0, d, u, f, w; r < n; )
        d = s[r++], d <= 127 ? o[c++] = d : d >= 192 && d < 224 ? (f = (d & 31) << 6 | s[r++] & 63, o[c++] = f >= 128 ? f : i) : d >= 224 && d < 240 ? (w = (d & 15) << 12 | (s[r++] & 63) << 6 | s[r++] & 63, o[c++] = w >= 2048 ? w : i) : d >= 240 && (u = (d & 7) << 18 | (s[r++] & 63) << 12 | (s[r++] & 63) << 6 | s[r++] & 63, u < 65536 || u > 1114111 ? o[c++] = i : (u -= 65536, o[c++] = 55296 + (u >> 10), o[c++] = 56320 + (u & 1023))), c > 8191 && ((h || (h = [])).push(String.fromCharCode.apply(String, o.slice(0, c))), c = 0);
      return h ? (c && h.push(String.fromCharCode.apply(String, o.slice(0, c))), h.join("")) : String.fromCharCode.apply(String, o.slice(0, c));
    }, t.write = function(s, r, n) {
      for (var h = n, o, c, d = 0; d < s.length; ++d)
        o = s.charCodeAt(d), o < 128 ? r[n++] = o : o < 2048 ? (r[n++] = o >> 6 | 192, r[n++] = o & 63 | 128) : (o & 64512) === 55296 && ((c = s.charCodeAt(d + 1)) & 64512) === 56320 ? (o = 65536 + ((o & 1023) << 10) + (c & 1023), ++d, r[n++] = o >> 18 | 240, r[n++] = o >> 12 & 63 | 128, r[n++] = o >> 6 & 63 | 128, r[n++] = o & 63 | 128) : (r[n++] = o >> 12 | 224, r[n++] = o >> 6 & 63 | 128, r[n++] = o & 63 | 128);
      return n - h;
    };
  })(lt)), lt;
}
var ct, qt;
function we() {
  if (qt) return ct;
  qt = 1, ct = a;
  function a(t, i, l) {
    var s = l || 8192, r = s >>> 1, n = null, h = s;
    return function(c) {
      if (c < 1 || c > r)
        return t(c);
      h + c > s && (n = t(s), h = 0);
      var d = i.call(n, h, h += c);
      return h & 7 && (h = (h | 7) + 1), d;
    };
  }
  return ct;
}
var gt, Mt;
function ye() {
  if (Mt) return gt;
  Mt = 1, gt = t;
  var a = W();
  function t(r, n) {
    this.lo = r >>> 0, this.hi = n >>> 0;
  }
  var i = t.zero = new t(0, 0);
  i.toNumber = function() {
    return 0;
  }, i.zzEncode = i.zzDecode = function() {
    return this;
  }, i.length = function() {
    return 1;
  };
  var l = t.zeroHash = "\0\0\0\0\0\0\0\0";
  t.fromNumber = function(n) {
    if (n === 0)
      return i;
    var h = n < 0;
    h && (n = -n);
    var o = n >>> 0, c = (n - o) / 4294967296 >>> 0;
    return h && (c = ~c >>> 0, o = ~o >>> 0, ++o > 4294967295 && (o = 0, ++c > 4294967295 && (c = 0))), new t(o, c);
  }, t.from = function(n) {
    if (typeof n == "number")
      return t.fromNumber(n);
    if (a.isString(n))
      if (a.Long)
        n = a.Long.fromString(n);
      else
        return t.fromNumber(parseInt(n, 10));
    return n.low || n.high ? new t(n.low >>> 0, n.high >>> 0) : i;
  }, t.prototype.toNumber = function(n) {
    if (!n && this.hi >>> 31) {
      var h = ~this.lo + 1 >>> 0, o = ~this.hi >>> 0;
      return h || (o = o + 1 >>> 0), -(h + o * 4294967296);
    }
    return this.lo + this.hi * 4294967296;
  }, t.prototype.toLong = function(n) {
    return a.Long ? new a.Long(this.lo | 0, this.hi | 0, !!n) : { low: this.lo | 0, high: this.hi | 0, unsigned: !!n };
  };
  var s = String.prototype.charCodeAt;
  return t.fromHash = function(n) {
    return n === l ? i : new t(
      (s.call(n, 0) | s.call(n, 1) << 8 | s.call(n, 2) << 16 | s.call(n, 3) << 24) >>> 0,
      (s.call(n, 4) | s.call(n, 5) << 8 | s.call(n, 6) << 16 | s.call(n, 7) << 24) >>> 0
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
    var n = this.hi >> 31;
    return this.hi = ((this.hi << 1 | this.lo >>> 31) ^ n) >>> 0, this.lo = (this.lo << 1 ^ n) >>> 0, this;
  }, t.prototype.zzDecode = function() {
    var n = -(this.lo & 1);
    return this.lo = ((this.lo >>> 1 | this.hi << 31) ^ n) >>> 0, this.hi = (this.hi >>> 1 ^ n) >>> 0, this;
  }, t.prototype.length = function() {
    var n = this.lo, h = (this.lo >>> 28 | this.hi << 4) >>> 0, o = this.hi >>> 24;
    return o === 0 ? h === 0 ? n < 16384 ? n < 128 ? 1 : 2 : n < 2097152 ? 3 : 4 : h < 16384 ? h < 128 ? 5 : 6 : h < 2097152 ? 7 : 8 : o < 128 ? 9 : 10;
  }, gt;
}
var H = { exports: {} }, me = H.exports, kt;
function _e() {
  return kt || (kt = 1, (function(a, t) {
    (function(i, l) {
      function s(r) {
        return r.default || r;
      }
      l(t), a.exports = s(t);
    })(
      typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : me,
      function(i) {
        Object.defineProperty(i, "__esModule", {
          value: !0
        }), i.default = void 0;
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
        function n(p) {
          var e = Math.clz32(p & -p);
          return p ? 31 - e : e;
        }
        s.isLong = r;
        var h = {}, o = {};
        function c(p, e) {
          var _, R, A;
          return e ? (p >>>= 0, (A = 0 <= p && p < 256) && (R = o[p], R) ? R : (_ = u(p, 0, !0), A && (o[p] = _), _)) : (p |= 0, (A = -128 <= p && p < 128) && (R = h[p], R) ? R : (_ = u(p, p < 0 ? -1 : 0, !1), A && (h[p] = _), _));
        }
        s.fromInt = c;
        function d(p, e) {
          if (isNaN(p)) return e ? D : P;
          if (e) {
            if (p < 0) return D;
            if (p >= v) return St;
          } else {
            if (p <= -N) return C;
            if (p + 1 >= N) return Tt;
          }
          return p < 0 ? d(-p, e).neg() : u(
            p % m | 0,
            p / m | 0,
            e
          );
        }
        s.fromNumber = d;
        function u(p, e, _) {
          return new s(p, e, _);
        }
        s.fromBits = u;
        var f = Math.pow;
        function w(p, e, _) {
          if (p.length === 0) throw Error("empty string");
          if (typeof e == "number" ? (_ = e, e = !1) : e = !!e, p === "NaN" || p === "Infinity" || p === "+Infinity" || p === "-Infinity")
            return e ? D : P;
          if (_ = _ || 10, _ < 2 || 36 < _) throw RangeError("radix");
          var R;
          if ((R = p.indexOf("-")) > 0) throw Error("interior hyphen");
          if (R === 0)
            return w(p.substring(1), e, _).neg();
          for (var A = d(f(_, 8)), B = P, S = 0; S < p.length; S += 8) {
            var x = Math.min(8, p.length - S), U = parseInt(p.substring(S, S + x), _);
            if (x < 8) {
              var I = d(f(_, x));
              B = B.mul(I).add(d(U));
            } else
              B = B.mul(A), B = B.add(d(U));
          }
          return B.unsigned = e, B;
        }
        s.fromString = w;
        function g(p, e) {
          return typeof p == "number" ? d(p, e) : typeof p == "string" ? w(p, e) : u(
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
        var Tt = u(-1, 2147483647, !1);
        s.MAX_VALUE = Tt;
        var St = u(-1, -1, !0);
        s.MAX_UNSIGNED_VALUE = St;
        var C = u(0, -2147483648, !1);
        s.MIN_VALUE = C;
        var y = s.prototype;
        y.toInt = function() {
          return this.unsigned ? this.low >>> 0 : this.low;
        }, y.toNumber = function() {
          return this.unsigned ? (this.high >>> 0) * m + (this.low >>> 0) : this.high * m + (this.low >>> 0);
        }, y.toString = function(e) {
          if (e = e || 10, e < 2 || 36 < e) throw RangeError("radix");
          if (this.isZero()) return "0";
          if (this.isNegative())
            if (this.eq(C)) {
              var _ = d(e), R = this.div(_), A = R.mul(_).sub(this);
              return R.toString(e) + A.toInt().toString(e);
            } else return "-" + this.neg().toString(e);
          for (var B = d(f(e, 6), this.unsigned), S = this, x = ""; ; ) {
            var U = S.div(B), I = S.sub(U.mul(B)).toInt() >>> 0, T = I.toString(e);
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
            return this.eq(C) ? 64 : this.neg().getNumBitsAbs();
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
          return !this.unsigned && this.eq(C) ? C : this.not().add($);
        }, y.neg = y.negate, y.add = function(e) {
          r(e) || (e = g(e));
          var _ = this.high >>> 16, R = this.high & 65535, A = this.low >>> 16, B = this.low & 65535, S = e.high >>> 16, x = e.high & 65535, U = e.low >>> 16, I = e.low & 65535, T = 0, q = 0, O = 0, F = 0;
          return F += B + I, O += F >>> 16, F &= 65535, O += A + U, q += O >>> 16, O &= 65535, q += R + x, T += q >>> 16, q &= 65535, T += _ + S, T &= 65535, u(O << 16 | F, T << 16 | q, this.unsigned);
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
            return u(_, l.get_high(), this.unsigned);
          }
          if (e.isZero()) return this.unsigned ? D : P;
          if (this.eq(C)) return e.isOdd() ? C : P;
          if (e.eq(C)) return this.isOdd() ? C : P;
          if (this.isNegative())
            return e.isNegative() ? this.neg().mul(e.neg()) : this.neg().mul(e).neg();
          if (e.isNegative())
            return this.mul(e.neg()).neg();
          if (this.lt(k) && e.lt(k))
            return d(
              this.toNumber() * e.toNumber(),
              this.unsigned
            );
          var R = this.high >>> 16, A = this.high & 65535, B = this.low >>> 16, S = this.low & 65535, x = e.high >>> 16, U = e.high & 65535, I = e.low >>> 16, T = e.low & 65535, q = 0, O = 0, F = 0, Y = 0;
          return Y += S * T, F += Y >>> 16, Y &= 65535, F += B * T, O += F >>> 16, F &= 65535, F += S * I, O += F >>> 16, F &= 65535, O += A * T, q += O >>> 16, O &= 65535, O += B * I, q += O >>> 16, O &= 65535, O += S * U, q += O >>> 16, O &= 65535, q += R * T + A * I + B * U + S * x, q &= 65535, u(F << 16 | Y, q << 16 | O, this.unsigned);
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
            return u(_, l.get_high(), this.unsigned);
          }
          if (this.isZero()) return this.unsigned ? D : P;
          var R, A, B;
          if (this.unsigned) {
            if (e.unsigned || (e = e.toUnsigned()), e.gt(this)) return D;
            if (e.gt(this.shru(1)))
              return At;
            B = D;
          } else {
            if (this.eq(C)) {
              if (e.eq($) || e.eq(it))
                return C;
              if (e.eq(C)) return $;
              var S = this.shr(1);
              return R = S.div(e).shl(1), R.eq(P) ? e.isNegative() ? $ : it : (A = this.sub(e.mul(R)), B = R.add(A.div(e)), B);
            } else if (e.eq(C)) return this.unsigned ? D : P;
            if (this.isNegative())
              return e.isNegative() ? this.neg().div(e.neg()) : this.neg().div(e).neg();
            if (e.isNegative()) return this.div(e.neg()).neg();
            B = P;
          }
          for (A = this; A.gte(e); ) {
            R = Math.max(1, Math.floor(A.toNumber() / e.toNumber()));
            for (var x = Math.ceil(Math.log(R) / Math.LN2), U = x <= 48 ? 1 : f(2, x - 48), I = d(R), T = I.mul(e); T.isNegative() || T.gt(A); )
              R -= U, I = d(R, this.unsigned), T = I.mul(e);
            I.isZero() && (I = $), B = B.add(I), A = A.sub(T);
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
            return u(_, l.get_high(), this.unsigned);
          }
          return this.sub(this.div(e).mul(e));
        }, y.mod = y.modulo, y.rem = y.modulo, y.not = function() {
          return u(~this.low, ~this.high, this.unsigned);
        }, y.countLeadingZeros = function() {
          return this.high ? Math.clz32(this.high) : Math.clz32(this.low) + 32;
        }, y.clz = y.countLeadingZeros, y.countTrailingZeros = function() {
          return this.low ? n(this.low) : n(this.high) + 32;
        }, y.ctz = y.countTrailingZeros, y.and = function(e) {
          return r(e) || (e = g(e)), u(
            this.low & e.low,
            this.high & e.high,
            this.unsigned
          );
        }, y.or = function(e) {
          return r(e) || (e = g(e)), u(
            this.low | e.low,
            this.high | e.high,
            this.unsigned
          );
        }, y.xor = function(e) {
          return r(e) || (e = g(e)), u(
            this.low ^ e.low,
            this.high ^ e.high,
            this.unsigned
          );
        }, y.shiftLeft = function(e) {
          return r(e) && (e = e.toInt()), (e &= 63) === 0 ? this : e < 32 ? u(
            this.low << e,
            this.high << e | this.low >>> 32 - e,
            this.unsigned
          ) : u(0, this.low << e - 32, this.unsigned);
        }, y.shl = y.shiftLeft, y.shiftRight = function(e) {
          return r(e) && (e = e.toInt()), (e &= 63) === 0 ? this : e < 32 ? u(
            this.low >>> e | this.high << 32 - e,
            this.high >> e,
            this.unsigned
          ) : u(
            this.high >> e - 32,
            this.high >= 0 ? 0 : -1,
            this.unsigned
          );
        }, y.shr = y.shiftRight, y.shiftRightUnsigned = function(e) {
          return r(e) && (e = e.toInt()), (e &= 63) === 0 ? this : e < 32 ? u(
            this.low >>> e | this.high << 32 - e,
            this.high >>> e,
            this.unsigned
          ) : e === 32 ? u(this.high, 0, this.unsigned) : u(this.high >>> e - 32, 0, this.unsigned);
        }, y.shru = y.shiftRightUnsigned, y.shr_u = y.shiftRightUnsigned, y.rotateLeft = function(e) {
          var _;
          return r(e) && (e = e.toInt()), (e &= 63) === 0 ? this : e === 32 ? u(this.high, this.low, this.unsigned) : e < 32 ? (_ = 32 - e, u(
            this.low << e | this.high >>> _,
            this.high << e | this.low >>> _,
            this.unsigned
          )) : (e -= 32, _ = 32 - e, u(
            this.high << e | this.low >>> _,
            this.low << e | this.high >>> _,
            this.unsigned
          ));
        }, y.rotl = y.rotateLeft, y.rotateRight = function(e) {
          var _;
          return r(e) && (e = e.toInt()), (e &= 63) === 0 ? this : e === 32 ? u(this.high, this.low, this.unsigned) : e < 32 ? (_ = 32 - e, u(
            this.high << _ | this.low >>> e,
            this.low << _ | this.high >>> e,
            this.unsigned
          )) : (e -= 32, _ = 32 - e, u(
            this.low << _ | this.high >>> e,
            this.high << _ | this.low >>> e,
            this.unsigned
          ));
        }, y.rotr = y.rotateRight, y.toSigned = function() {
          return this.unsigned ? u(this.low, this.high, !1) : this;
        }, y.toUnsigned = function() {
          return this.unsigned ? this : u(this.low, this.high, !0);
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
          return u(R, A, _);
        }, s.fromValue = function(e, _) {
          return typeof e == "bigint" ? s.fromBigInt(e, _) : g(e, _);
        }, y.toBigInt = function() {
          var e = BigInt(this.low >>> 0), _ = BigInt(this.unsigned ? this.high >>> 0 : this.high);
          return _ << BigInt(32) | e;
        }), i.default = s;
      }
    );
  })(H, H.exports)), H.exports;
}
var Pt;
function W() {
  return Pt || (Pt = 1, (function(a) {
    var t = a;
    t.asPromise = le(), t.base64 = ce(), t.EventEmitter = ge(), t.float = de(), t.utf8 = pe(), t.pool = we(), t.LongBits = ye();
    function i(r) {
      return r === "__proto__" || r === "prototype" || r === "constructor";
    }
    t.isUnsafeProperty = i, t.isNode = !!(typeof z < "u" && z && z.process && z.process.versions && z.process.versions.node), t.global = t.isNode && z || typeof window < "u" && window || typeof self < "u" && self || X, t.emptyArray = Object.freeze ? Object.freeze([]) : (
      /* istanbul ignore next */
      []
    ), t.emptyObject = Object.freeze ? Object.freeze({}) : (
      /* istanbul ignore next */
      {}
    ), t.isInteger = Number.isInteger || /* istanbul ignore next */
    function(n) {
      return typeof n == "number" && isFinite(n) && Math.floor(n) === n;
    }, t.isString = function(n) {
      return typeof n == "string" || n instanceof String;
    }, t.isObject = function(n) {
      return n && typeof n == "object";
    }, t.isset = /**
     * Checks if a property on a message is considered to be present.
     * @param {Object} obj Plain object or message instance
     * @param {string} prop Property name
     * @returns {boolean} `true` if considered to be present, otherwise `false`
     */
    t.isSet = function(n, h) {
      var o = n[h];
      return o != null && Object.hasOwnProperty.call(n, h) ? typeof o != "object" || (Array.isArray(o) ? o.length : Object.keys(o).length) > 0 : !1;
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
    })(), t._Buffer_from = null, t._Buffer_allocUnsafe = null, t.newBuffer = function(n) {
      return typeof n == "number" ? t.Buffer ? t._Buffer_allocUnsafe(n) : new t.Array(n) : t.Buffer ? t._Buffer_from(n) : typeof Uint8Array > "u" ? n : new Uint8Array(n);
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
    })(), t.key2Re = /^true|false|0|1$/, t.key32Re = /^-?(?:0|[1-9][0-9]*)$/, t.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/, t.longToHash = function(n) {
      return n ? t.LongBits.from(n).toHash() : t.LongBits.zeroHash;
    }, t.longFromHash = function(n, h) {
      var o = t.LongBits.fromHash(n);
      return t.Long ? t.Long.fromBits(o.lo, o.hi, h) : o.toNumber(!!h);
    };
    function l(r) {
      var n = typeof arguments[arguments.length - 1] == "boolean", h = n ? arguments.length - 1 : arguments.length;
      n = n && arguments[arguments.length - 1];
      for (var o = 1; o < h; ++o) {
        var c = arguments[o];
        if (c)
          for (var d = Object.keys(c), u = 0; u < d.length; ++u)
            !i(d[u]) && (r[d[u]] === void 0 || !n) && (r[d[u]] = c[d[u]]);
      }
      return r;
    }
    t.merge = l, t.nestingLimit = 32, t.recursionLimit = 100, t.makeProp = function(n, h) {
      Object.defineProperty(n, h, {
        enumerable: !0,
        configurable: !0,
        writable: !0
      });
    }, t.lcFirst = function(n) {
      return n.charAt(0).toLowerCase() + n.substring(1);
    };
    function s(r) {
      function n(h, o) {
        if (!(this instanceof n))
          return new n(h, o);
        Object.defineProperty(this, "message", { get: function() {
          return h;
        } }), Error.captureStackTrace ? Error.captureStackTrace(this, n) : Object.defineProperty(this, "stack", { value: new Error().stack || "" }), o && l(this, o);
      }
      return n.prototype = Object.create(Error.prototype, {
        constructor: {
          value: n,
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
      }), n;
    }
    t.newError = s, t.ProtocolError = s("ProtocolError"), t.oneOfGetter = function(n) {
      for (var h = {}, o = 0; o < n.length; ++o)
        h[n[o]] = 1;
      return function() {
        for (var c = Object.keys(this), d = c.length - 1; d > -1; --d)
          if (h[c[d]] === 1 && this[c[d]] !== void 0 && this[c[d]] !== null)
            return c[d];
      };
    }, t.oneOfSetter = function(n) {
      return function(h) {
        for (var o = 0; o < n.length; ++o)
          n[o] !== h && delete this[n[o]];
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
      function(h, o) {
        return new r(h, o);
      }, t._Buffer_allocUnsafe = r.allocUnsafe || /* istanbul ignore next */
      function(h) {
        return new r(h);
      };
    };
  })(X)), X;
}
var dt, Dt;
function te() {
  if (Dt) return dt;
  Dt = 1, dt = o;
  var a = W(), t, i = a.LongBits, l = a.base64, s = a.utf8;
  function r(b, m, v) {
    this.fn = b, this.len = m, this.next = void 0, this.val = v;
  }
  function n() {
  }
  function h(b) {
    this.head = b.head, this.tail = b.tail, this.len = b.len, this.next = b.states;
  }
  function o() {
    this.len = 0, this.head = new r(n, 0, 0), this.tail = this.head, this.states = null;
  }
  var c = function() {
    return a.Buffer ? function() {
      return (o.create = function() {
        return new t();
      })();
    } : function() {
      return new o();
    };
  };
  o.create = c(), o.alloc = function(m) {
    return new a.Array(m);
  }, a.Array !== Array && (o.alloc = a.pool(o.alloc, a.Array.prototype.subarray)), o.prototype._push = function(m, v, N) {
    return this.tail = this.tail.next = new r(m, v, N), this.len += v, this;
  };
  function d(b, m, v) {
    m[v] = b & 255;
  }
  function u(b, m, v) {
    for (; b > 127; )
      m[v++] = b & 127 | 128, b >>>= 7;
    m[v] = b;
  }
  function f(b, m) {
    this.len = b, this.next = void 0, this.val = m;
  }
  f.prototype = Object.create(r.prototype), f.prototype.fn = u, o.prototype.uint32 = function(m) {
    return this.len += (this.tail = this.tail.next = new f(
      (m = m >>> 0) < 128 ? 1 : m < 16384 ? 2 : m < 2097152 ? 3 : m < 268435456 ? 4 : 5,
      m
    )).len, this;
  }, o.prototype.int32 = function(m) {
    return (m |= 0) < 0 ? this._push(w, 10, i.fromNumber(m)) : this.uint32(m);
  }, o.prototype.sint32 = function(m) {
    return this.uint32((m << 1 ^ m >> 31) >>> 0);
  };
  function w(b, m, v) {
    for (var N = b.lo, k = b.hi; k; )
      m[v++] = N & 127 | 128, N = (N >>> 7 | k << 25) >>> 0, k >>>= 7;
    for (; N > 127; )
      m[v++] = N & 127 | 128, N = N >>> 7;
    m[v++] = N;
  }
  o.prototype.uint64 = function(m) {
    var v = i.from(m);
    return this._push(w, v.length(), v);
  }, o.prototype.int64 = o.prototype.uint64, o.prototype.sint64 = function(m) {
    var v = i.from(m).zzEncode();
    return this._push(w, v.length(), v);
  }, o.prototype.bool = function(m) {
    return this._push(d, 1, m ? 1 : 0);
  };
  function g(b, m, v) {
    m[v] = b & 255, m[v + 1] = b >>> 8 & 255, m[v + 2] = b >>> 16 & 255, m[v + 3] = b >>> 24;
  }
  o.prototype.fixed32 = function(m) {
    return this._push(g, 4, m >>> 0);
  }, o.prototype.sfixed32 = o.prototype.fixed32, o.prototype.fixed64 = function(m) {
    var v = i.from(m);
    return this._push(g, 4, v.lo)._push(g, 4, v.hi);
  }, o.prototype.sfixed64 = o.prototype.fixed64, o.prototype.float = function(m) {
    return this._push(a.float.writeFloatLE, 4, m);
  }, o.prototype.double = function(m) {
    return this._push(a.float.writeDoubleLE, 8, m);
  };
  var E = a.Array.prototype.set ? function(m, v, N) {
    v.set(m, N);
  } : function(m, v, N) {
    for (var k = 0; k < m.length; ++k)
      v[N + k] = m[k];
  };
  return o.prototype.bytes = function(m) {
    var v = m.length >>> 0;
    if (!v)
      return this._push(d, 1, 0);
    if (a.isString(m)) {
      var N = o.alloc(v = l.length(m));
      l.decode(m, N, 0), m = N;
    }
    return this.uint32(v)._push(E, v, m);
  }, o.prototype.string = function(m) {
    var v = s.length(m);
    return v ? this.uint32(v)._push(s.write, v, m) : this._push(d, 1, 0);
  }, o.prototype.fork = function() {
    return this.states = new h(this), this.head = this.tail = new r(n, 0, 0), this.len = 0, this;
  }, o.prototype.reset = function() {
    return this.states ? (this.head = this.states.head, this.tail = this.states.tail, this.len = this.states.len, this.states = this.states.next) : (this.head = this.tail = new r(n, 0, 0), this.len = 0), this;
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
  jt = 1, pt = i;
  var a = te();
  (i.prototype = Object.create(a.prototype)).constructor = i;
  var t = W();
  function i() {
    a.call(this);
  }
  i._configure = function() {
    i.alloc = t._Buffer_allocUnsafe, i.writeBytesBuffer = t.Buffer && t.Buffer.prototype instanceof Uint8Array && t.Buffer.prototype.set.name === "set" ? function(r, n, h) {
      n.set(r, h);
    } : function(r, n, h) {
      if (r.copy)
        r.copy(n, h, 0, r.length);
      else for (var o = 0; o < r.length; )
        n[h++] = r[o++];
    };
  }, i.prototype.bytes = function(r) {
    t.isString(r) && (r = t._Buffer_from(r, "base64"));
    var n = r.length >>> 0;
    return this.uint32(n), n && this._push(i.writeBytesBuffer, n, r), this;
  };
  function l(s, r, n) {
    s.length < 40 ? t.utf8.write(s, r, n) : r.utf8Write ? r.utf8Write(s, n) : r.write(s, n);
  }
  return i.prototype.string = function(r) {
    var n = t.Buffer.byteLength(r);
    return this.uint32(n), n && this._push(l, n, r), this;
  }, i._configure(), pt;
}
var wt, Wt;
function ee() {
  if (Wt) return wt;
  Wt = 1, wt = r;
  var a = W(), t, i = a.LongBits, l = a.utf8;
  function s(u, f) {
    return RangeError("index out of range: " + u.pos + " + " + (f || 1) + " > " + u.len);
  }
  function r(u) {
    this.buf = u, this.pos = 0, this.len = u.length;
  }
  var n = typeof Uint8Array < "u" ? function(f) {
    if (f instanceof Uint8Array || Array.isArray(f))
      return new r(f);
    throw Error("illegal buffer");
  } : function(f) {
    if (Array.isArray(f))
      return new r(f);
    throw Error("illegal buffer");
  }, h = function() {
    return a.Buffer ? function(w) {
      return (r.create = function(E) {
        return a.Buffer.isBuffer(E) ? new t(E) : n(E);
      })(w);
    } : n;
  };
  r.create = h(), r.prototype._slice = a.Array.prototype.subarray || /* istanbul ignore next */
  a.Array.prototype.slice, r.prototype.uint32 = /* @__PURE__ */ (function() {
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
    var u = new i(0, 0), f = 0;
    if (this.len - this.pos > 4) {
      for (; f < 4; ++f)
        if (u.lo = (u.lo | (this.buf[this.pos] & 127) << f * 7) >>> 0, this.buf[this.pos++] < 128)
          return u;
      if (u.lo = (u.lo | (this.buf[this.pos] & 127) << 28) >>> 0, u.hi = (u.hi | (this.buf[this.pos] & 127) >> 4) >>> 0, this.buf[this.pos++] < 128)
        return u;
      f = 0;
    } else {
      for (; f < 3; ++f) {
        if (this.pos >= this.len)
          throw s(this);
        if (u.lo = (u.lo | (this.buf[this.pos] & 127) << f * 7) >>> 0, this.buf[this.pos++] < 128)
          return u;
      }
      return u.lo = (u.lo | (this.buf[this.pos++] & 127) << f * 7) >>> 0, u;
    }
    if (this.len - this.pos > 4) {
      for (; f < 5; ++f)
        if (u.hi = (u.hi | (this.buf[this.pos] & 127) << f * 7 + 3) >>> 0, this.buf[this.pos++] < 128)
          return u;
    } else
      for (; f < 5; ++f) {
        if (this.pos >= this.len)
          throw s(this);
        if (u.hi = (u.hi | (this.buf[this.pos] & 127) << f * 7 + 3) >>> 0, this.buf[this.pos++] < 128)
          return u;
      }
    throw Error("invalid varint encoding");
  }
  r.prototype.bool = function() {
    return this.uint32() !== 0;
  };
  function c(u, f) {
    return (u[f - 4] | u[f - 3] << 8 | u[f - 2] << 16 | u[f - 1] << 24) >>> 0;
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
  function d() {
    if (this.pos + 8 > this.len)
      throw s(this, 8);
    return new i(c(this.buf, this.pos += 4), c(this.buf, this.pos += 4));
  }
  return r.prototype.float = function() {
    if (this.pos + 4 > this.len)
      throw s(this, 4);
    var f = a.float.readFloatLE(this.buf, this.pos);
    return this.pos += 4, f;
  }, r.prototype.double = function() {
    if (this.pos + 8 > this.len)
      throw s(this, 4);
    var f = a.float.readDoubleLE(this.buf, this.pos);
    return this.pos += 8, f;
  }, r.prototype.bytes = function() {
    var f = this.uint32(), w = this.pos, g = this.pos + f;
    if (g > this.len)
      throw s(this, f);
    if (this.pos += f, Array.isArray(this.buf))
      return this.buf.slice(w, g);
    if (w === g) {
      var E = a.Buffer;
      return E ? E.alloc(0) : new this.buf.constructor(0);
    }
    return this._slice.call(this.buf, w, g);
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
  }, r.recursionLimit = a.recursionLimit, r.prototype.skipType = function(u, f) {
    if (f === void 0 && (f = 0), f > r.recursionLimit)
      throw Error("maximum nesting depth exceeded");
    switch (u) {
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
        for (; (u = this.uint32() & 7) !== 4; )
          this.skipType(u, f + 1);
        break;
      case 5:
        this.skip(4);
        break;
      /* istanbul ignore next */
      default:
        throw Error("invalid wire type " + u + " at offset " + this.pos);
    }
    return this;
  }, r._configure = function(u) {
    t = u, r.create = h(), t._configure();
    var f = a.Long ? "toLong" : (
      /* istanbul ignore next */
      "toNumber"
    );
    a.merge(r.prototype, {
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
        return d.call(this)[f](!0);
      },
      sfixed64: function() {
        return d.call(this)[f](!1);
      }
    });
  }, wt;
}
var yt, $t;
function be() {
  if ($t) return yt;
  $t = 1, yt = i;
  var a = ee();
  (i.prototype = Object.create(a.prototype)).constructor = i;
  var t = W();
  function i(l) {
    a.call(this, l);
  }
  return i._configure = function() {
    t.Buffer && (i.prototype._slice = t.Buffer.prototype.slice);
  }, i.prototype.string = function() {
    var s = this.uint32();
    return this.buf.utf8Slice ? this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + s, this.len)) : this.buf.toString("utf-8", this.pos, this.pos = Math.min(this.pos + s, this.len));
  }, i._configure(), yt;
}
var mt = {}, _t, zt;
function ve() {
  if (zt) return _t;
  zt = 1, _t = t;
  var a = W();
  (t.prototype = Object.create(a.EventEmitter.prototype)).constructor = t;
  function t(i, l, s) {
    if (typeof i != "function")
      throw TypeError("rpcImpl must be a function");
    a.EventEmitter.call(this), this.rpcImpl = i, this.requestDelimited = !!l, this.responseDelimited = !!s;
  }
  return t.prototype.rpcCall = function i(l, s, r, n, h) {
    if (!n)
      throw TypeError("request must be specified");
    var o = this;
    if (!h)
      return a.asPromise(i, o, l, s, r, n);
    if (!o.rpcImpl) {
      setTimeout(function() {
        h(Error("already ended"));
      }, 0);
      return;
    }
    try {
      return o.rpcImpl(
        l,
        s[o.requestDelimited ? "encodeDelimited" : "encode"](n).finish(),
        function(d, u) {
          if (d)
            return o.emit("error", d, l), h(d);
          if (u === null) {
            o.end(
              /* endedByRPC */
              !0
            );
            return;
          }
          if (!(u instanceof r))
            try {
              u = r[o.responseDelimited ? "decodeDelimited" : "decode"](u);
            } catch (f) {
              return o.emit("error", f, l), h(f);
            }
          return o.emit("data", u, l), h(null, u);
        }
      );
    } catch (c) {
      o.emit("error", c, l), setTimeout(function() {
        h(c);
      }, 0);
      return;
    }
  }, t.prototype.end = function(l) {
    return this.rpcImpl && (l || this.rpcImpl(null, null, null), this.rpcImpl = null, this.emit("end").off()), this;
  }, _t;
}
var Zt;
function Re() {
  return Zt || (Zt = 1, (function(a) {
    var t = a;
    t.Service = ve();
  })(mt)), mt;
}
var Et, Vt;
function Le() {
  return Vt || (Vt = 1, Et = /* @__PURE__ */ Object.create(null)), Et;
}
var Ht;
function Ne() {
  return Ht || (Ht = 1, (function(a) {
    var t = a;
    t.build = "minimal", t.Writer = te(), t.BufferWriter = Ee(), t.Reader = ee(), t.BufferReader = be(), t.util = W(), t.rpc = Re(), t.roots = Le(), t.configure = i;
    function i() {
      t.util._configure(), t.Writer._configure(t.BufferWriter), t.Reader._configure(t.BufferReader);
    }
    i();
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
const j = null, tt = 0, re = "str", G = 1, Rt = "str_null", ne = new Uint8Array(), Lt = new Uint8Array(), ie = 0n, Nt = 1n, J = 32n;
function Se(a, t) {
  let i = 0, l = 0, s = 0;
  if (a.length - t > 4) {
    for (; s < 4; ++s)
      if (l = (l | (a[t] & 127) << s * 7) >>> 0, a[t++] < 128) return BigInt(l);
    if (l = (l | (a[t] & 127) << 28) >>> 0, i = (i | (a[t] & 127) >> 4) >>> 0, a[t++] < 128)
      return BigInt(i) << J | BigInt(l);
    s = 0;
  } else {
    for (; s < 3; ++s) {
      if (t >= a.length) throw Error("Index out of range");
      if (l = (l | (a[t] & 127) << s * 7) >>> 0, a[t++] < 128) return BigInt(l);
    }
    return l = (l | (a[t++] & 127) << s * 7) >>> 0, BigInt(i) << J | BigInt(l);
  }
  if (a.length - t > 4) {
    for (; s < 5; ++s)
      if (i = (i | (a[t] & 127) << s * 7 + 3) >>> 0, a[t++] < 128) {
        const r = BigInt(i) << J | BigInt(l);
        return BigInt.asIntN(64, r);
      }
  } else
    for (; s < 5; ++s) {
      if (t >= a.length) throw Error("Index out of range");
      if (i = (i | (a[t] & 127) << s * 7 + 3) >>> 0, a[t++] < 128) {
        const r = BigInt(i) << J | BigInt(l);
        return BigInt.asIntN(64, r);
      }
    }
  throw Error("invalid varint encoding");
}
class se extends Error {
  queryErrorInfo;
  constructor(t, i) {
    super(t), this.queryErrorInfo = i;
  }
  toString() {
    return `${super.toString()}
Query:
${this.queryErrorInfo.query}`;
  }
}
function Yt(a) {
  switch (a) {
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
      return `INVALID(${a})`;
  }
}
function Oe(a, t) {
  switch (a) {
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
      throw new Error(`Unknown CellType ${a}`);
  }
}
const Ie = [
  "UNKNOWN",
  "NULL",
  "VARINT",
  "FLOAT64",
  "STRING",
  "BLOB"
], V = 2;
class Ce {
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
    const i = new vt(t, this);
    return L(i.valid()), i;
  }
  maybeFirstRow(t) {
    const i = new vt(t, this);
    if (i.valid())
      return i;
  }
  waitAllRows() {
    return L(this.allRowsPromise === void 0), this.allRowsPromise = K(), this._isComplete && this.resolveOrReject(this.allRowsPromise, this), this.allRowsPromise;
  }
  appendResultBatch(t) {
    const i = M.Reader.create(t);
    L(i.pos === 0);
    const l = this.columnNames.length === 0, s = /* @__PURE__ */ new Set();
    for (; i.pos < i.len; ) {
      const r = i.uint32();
      switch (r >>> 3) {
        case 1: {
          L(l);
          const n = i.string();
          let h = n;
          for (let o = 1; s.has(h); ++o)
            h = `${n}_${o}`, L(o < 100);
          s.add(h), this.columnNames.push(h);
          break;
        }
        case 2: {
          const n = i.string();
          this._error = n !== void 0 && n.length ? n : void 0;
          break;
        }
        case 3: {
          const n = i.uint32(), h = t.subarray(i.pos, i.pos + n);
          i.pos += n;
          const o = new xe(h);
          this.batches.push(o), this._isComplete = o.isLastBatch;
          const c = this.columnNames.length;
          c !== 0 ? (L(o.numCells % c === 0), this._numRows += o.numCells / c) : L(o.numCells === 0);
          break;
        }
        case 7:
          this._elapsedTimeMs = i.double();
          break;
        default:
          i.skipType(r & 7);
          break;
      }
    }
    this._isComplete && this.allRowsPromise !== void 0 && this.resolveOrReject(this.allRowsPromise, this);
  }
  get errorInfo() {
    return this._errorInfo;
  }
  resolveOrReject(t, i) {
    this._error === void 0 ? t.resolve(i) : t.reject(new se(this._error, this._errorInfo));
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
    const i = M.Reader.create(t);
    L(i.pos === 0);
    const l = i.len;
    for (; i.pos < l; ) {
      const s = i.uint32();
      switch (s >>> 3) {
        case 1:
          L((s & 7) === V), this.cellTypesLen = i.uint32(), this.cellTypesOff = i.pos, i.pos += this.cellTypesLen;
          break;
        case 2: {
          L((s & 7) === V);
          const r = i.uint32();
          this.varintOff = i.pos, this.varintLen = r, L(i.buf === t), i.pos += r;
          break;
        }
        case 3: {
          L((s & 7) === V);
          const r = i.uint32();
          L(r % 8 === 0);
          const n = r / 8, h = t.byteOffset + i.pos;
          if (h % 8 === 0)
            this.float64Cells = new Float64Array(
              t.buffer,
              h,
              n
            );
          else {
            const o = t.buffer.slice(h, h + r);
            this.float64Cells = new Float64Array(o);
          }
          i.pos += r;
          break;
        }
        case 4:
          L((s & 7) === V), this.blobCells.push(new Uint8Array(i.bytes()));
          break;
        case 5: {
          L((s & 7) === V);
          const r = i.uint32();
          L(i.pos + r <= l);
          const n = t.subarray(i.pos, i.pos + r);
          this.stringCells = new TextDecoder().decode(n).split("\0"), i.pos += r;
          break;
        }
        case 6:
          this.isLastBatch = !!i.bool();
          break;
        default:
          i.skipType(s & 7);
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
  constructor(t, i, l) {
    Object.assign(this, t), this.rowData = i, this.rowSpec = { ...t }, this.resultObj = l, this.next();
  }
  valid() {
    return this.isValid;
  }
  makeError(t) {
    return new se(t, this.resultObj.errorInfo);
  }
  get(t) {
    const i = this.rowData[t];
    if (i === void 0)
      throw this.makeError(
        `Column '${t}' doesn't exist. Actual columns: [${this.columnNames.join(",")}]`
      );
    return i;
  }
  next() {
    for (; this.nextCellTypeOff + this.numColumns > this.cellTypesEnd; )
      if (L(
        this.nextCellTypeOff === this.cellTypesEnd || this.cellTypesEnd === -1
      ), !this.tryMoveToNextBatch()) {
        this.isValid = !1;
        return;
      }
    const t = this.rowData, i = this.numColumns;
    for (let l = 0; l < i; l++) {
      const s = this.batchBytes[this.nextCellTypeOff++], r = this.columnNames[l], n = this.rowSpec[r];
      switch (s) {
        case 1:
          t[r] = null;
          break;
        case 2:
          if (n === tt || n === G) {
            const h = this.varIntReader.int64();
            t[r] = h;
          } else {
            const h = Se(
              this.batchBytes,
              this.varIntReader.pos
            );
            t[r] = h, this.varIntReader.skip();
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
    const i = Z(this.resultObj.batches[t]);
    this.batchBytes = i.batchBytes, this.nextCellTypeOff = i.cellTypesOff, this.cellTypesEnd = i.cellTypesOff + i.cellTypesLen, this.float64Cells = i.float64Cells, this.blobCells = i.blobCells, this.stringCells = i.stringCells, this.varIntReader = M.Reader.create(i.batchBytes), this.varIntReader.pos = i.varintOff, this.varIntReader.len = i.varintOff + i.varintLen, this.nextFloat64Cell = 0, this.nextStringCell = 0, this.nextBlobCell = 0;
    for (const s of Object.keys(this.rowSpec))
      if (this.columnNames.indexOf(s) < 0)
        throw this.makeError(
          `Column ${s} not found in the SQL result set {${this.columnNames.join(" ")}}`
        );
    const l = this.numColumns;
    if (i.numCells === 0)
      return L(i.isLastBatch), !1;
    L(l > 0);
    for (let s = this.nextCellTypeOff; s < this.cellTypesEnd; s++) {
      const r = (s - this.nextCellTypeOff) % l, n = this.columnNames[r], h = this.batchBytes[s], o = this.rowSpec[n];
      if (o === void 0) continue;
      let c = "";
      if (Oe(h, o) || (h === 1 ? c = `SQL value is NULL but that was not expected (expected type: ${Yt(o)}). Did you mean NUM_NULL, LONG_NULL, STR_NULL or BLOB_NULL?` : c = `Incompatible cell type. Expected: ${Yt(
        o
      )} actual: ${Ie[h]}`), c.length > 0) {
        const d = Math.floor(s / l);
        throw this.makeError(`Error @ row: ${d} col: '${n}': ${c}`);
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
  constructor(t, i) {
    const l = this;
    Object.assign(l, t), this._impl = new Fe(t, l, i), this.next = this._impl.next.bind(this._impl), this.valid = this._impl.valid.bind(this._impl), this.get = this._impl.get.bind(this._impl);
  }
}
class Ue {
  impl;
  thenCalled = !1;
  constructor(t) {
    this.impl = new Ce(t);
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
  then(t, i) {
    return ae(this.thenCalled), this.thenCalled = !0, this.ensureAllRowsPromise().then(t, i);
  }
}
function qe(a) {
  return new Ue(a);
}
var Q = /* @__PURE__ */ ((a) => (a[a.TPM_UNSPECIFIED = 0] = "TPM_UNSPECIFIED", a[a.TPM_APPEND_TRACE_DATA = 1] = "TPM_APPEND_TRACE_DATA", a[a.TPM_FINALIZE_TRACE_DATA = 2] = "TPM_FINALIZE_TRACE_DATA", a[a.TPM_QUERY_STREAMING = 3] = "TPM_QUERY_STREAMING", a[a.TPM_RESET_TRACE_PROCESSOR = 11] = "TPM_RESET_TRACE_PROCESSOR", a))(Q || {});
const et = 1, rt = 2, Me = 3, ke = 5, Pe = 101, De = 103, je = 107, We = 201, $e = 203, ze = 212, Ze = 1, Ve = 2, He = 1;
function nt(a) {
  const t = new M.Writer();
  return t.uint32(10).bytes(a), t.finish();
}
function Qe(a, t) {
  const i = new M.Writer();
  return i.uint32(et << 3 | 0).int64(a), i.uint32(rt << 3 | 0).int32(
    1
    /* TPM_APPEND_TRACE_DATA */
  ), i.uint32(Pe << 3 | 2).bytes(t), nt(i.finish());
}
function Ge(a) {
  const t = new M.Writer();
  return t.uint32(et << 3 | 0).int64(a), t.uint32(rt << 3 | 0).int32(
    2
    /* TPM_FINALIZE_TRACE_DATA */
  ), nt(t.finish());
}
function Ye(a) {
  const t = new M.Writer();
  return t.uint32(et << 3 | 0).int64(a), t.uint32(rt << 3 | 0).int32(
    11
    /* TPM_RESET_TRACE_PROCESSOR */
  ), t.uint32(je << 3 | 2).fork().ldelim(), nt(t.finish());
}
function Xe(a, t) {
  const i = new M.Writer();
  return i.uint32(et << 3 | 0).int64(a), i.uint32(rt << 3 | 0).int32(
    3
    /* TPM_QUERY_STREAMING */
  ), i.uint32(De << 3 | 2).fork(), i.uint32(Ze << 3 | 2).string(t), i.ldelim(), nt(i.finish());
}
function Xt(a, t, i) {
  let l;
  for (; a.pos < t; ) {
    const s = a.uint32();
    s >>> 3 === i ? l = a.string() : a.skipType(s & 7);
  }
  return l !== void 0 && l.length > 0 ? l : void 0;
}
function Je(a) {
  const t = M.Reader.create(a), i = { response: void 0 };
  for (; t.pos < t.len; ) {
    const l = t.uint32();
    switch (l >>> 3) {
      case Me:
        i.response = t.int32();
        break;
      case ke:
        i.fatalError = t.string();
        break;
      case We: {
        const r = t.uint32(), n = t.pos + r;
        i.error = Xt(t, n, Ve), t.pos = n;
        break;
      }
      case ze: {
        const r = t.uint32(), n = t.pos + r;
        i.error = Xt(t, n, He), t.pos = n;
        break;
      }
      case $e: {
        const r = t.uint32();
        i.queryResultBytes = a.subarray(t.pos, t.pos + r), t.pos += r;
        break;
      }
      default:
        t.skipType(l & 7);
        break;
    }
  }
  return i;
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
      const i = this.rxBuf.readMessage();
      if (i === void 0) break;
      this.onRpcResponseMessage(i);
    }
  }
  onRpcResponseMessage(t) {
    const i = Je(t);
    if (i.fatalError !== void 0 && i.fatalError.length > 0)
      throw this._failed = i.fatalError, new Error(i.fatalError);
    switch (i.response) {
      case Q.TPM_APPEND_TRACE_DATA: {
        const l = Z(this.pendingParses.shift());
        i.error !== void 0 ? l.reject(new Error(i.error)) : l.resolve();
        break;
      }
      case Q.TPM_FINALIZE_TRACE_DATA: {
        const l = Z(this.pendingEOFs.shift());
        i.error !== void 0 ? l.reject(new Error(i.error)) : l.resolve();
        break;
      }
      case Q.TPM_RESET_TRACE_PROCESSOR:
        Z(this.pendingResets.shift()).resolve();
        break;
      case Q.TPM_QUERY_STREAMING: {
        const l = Z(i.queryResultBytes), s = Z(this.pendingQueries[0]);
        s.appendResultBatch(l), s.isComplete() && this.pendingQueries.shift();
        break;
      }
      default:
        console.warn("Unexpected TraceProcessor response:", i.response);
        break;
    }
  }
  // Push trace data into the engine. It auto-detects the trace type.
  parse(t) {
    const i = K();
    return this.pendingParses.push(i), this.rpcSendRequestBytes(Qe(this.txSeqId++, t)), i;
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
    const i = qe({ query: t });
    return this.pendingQueries.push(i), this.rpcSendRequestBytes(Xe(this.txSeqId++, t)), await i;
  }
  get failed() {
    return this._failed;
  }
}
const oe = '(function(){"use strict";function l(r,t){if(!r)throw new Error("Failed assertion")}function c(r,t){if(r==null)throw new Error(t??"Value is null or undefined");return r}const u=32*1024*1024;class f{aborted=!1;connection;reqBufferAddr=0;lastStderr=[];messagePort;async initialize(t,o,e){l(this.messagePort===void 0),this.messagePort=t;const a=await(await this.loadModuleFactory(o))({locateFile:n=>n,print:n=>console.log(n),printErr:n=>this.appendAndLogErr(n),instantiateWasm:(n,i)=>{const h=new WebAssembly.Instance(e,n);return i(h,e),h.exports}}),d=a.addFunction(this.onReply.bind(this),"vpi");this.reqBufferAddr=Number(a.ccall("trace_processor_rpc_init","pointer",["pointer","number"],[d,u]))>>>0,this.connection=a,t.onmessage=this.onMessage.bind(this)}async loadModuleFactory(t){const o=await(await fetch(t)).text(),e={exports:{}};return new Function("module","exports",o)(e,e.exports),c(e.exports.default,`${t} did not assign module.exports.default — its UMD wrapper may have changed`)}onMessage(t){if(this.aborted)throw new Error("Wasm module crashed");const o=c(this.connection);l(t.data instanceof Uint8Array);const e=t.data;let s=0;for(;s<e.length;){const a=Math.min(e.length-s,u),d=e.subarray(s,s+a);o.HEAPU8.set(d,this.reqBufferAddr),s+=a;try{o.ccall("trace_processor_on_rpc_request","void",["number"],[a])}catch(n){this.aborted=!0;let i=`${n}`;throw n instanceof Error&&(i=`${n.name}: ${n.message}\n${n.stack}`),i+=`\n\nstderr: \n`+this.lastStderr.join(`\n`),new Error(i)}}}onReply(t,o){const e=t>>>0,s=c(this.connection).HEAPU8.slice(e,e+o);c(this.messagePort).postMessage(s,[s.buffer])}appendAndLogErr(t){console.warn(t),this.lastStderr.push(t),this.lastStderr.length>512&&this.lastStderr.shift()}}const p=self,m=new f;p.onmessage=r=>{const t=r.data;m.initialize(t.port,t.wasmJsUrl,t.wasmModule)}})();\n', Jt = typeof self < "u" && self.Blob && new Blob(["(self.URL || self.webkitURL).revokeObjectURL(self.location.href);", oe], { type: "text/javascript;charset=utf-8" });
function tr(a) {
  let t;
  try {
    if (t = Jt && (self.URL || self.webkitURL).createObjectURL(Jt), !t) throw "";
    const i = new Worker(t, {
      name: a?.name
    });
    return i.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(t);
    }), i;
  } catch {
    return new Worker(
      "data:text/javascript;charset=utf-8," + encodeURIComponent(oe),
      {
        name: a?.name
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
function Kt(a, t) {
  const i = a.endsWith("/") ? a : `${a}/`;
  return new URL(t, i).href;
}
class Bt extends Ke {
  port;
  worker;
  constructor(t, i) {
    super(), this.port = t, this.worker = i, this.port.onmessage = this.onMessage.bind(this);
  }
  static async create(t) {
    const i = await WebAssembly.compileStreaming(
      fetch(Kt(t, "trace_processor.wasm"))
    ), l = new tr(), s = new MessageChannel();
    return l.postMessage(
      {
        port: s.port1,
        wasmModule: i,
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
async function rr(a) {
  const t = a?.wasmBaseUrl ?? he;
  let i;
  try {
    i = await Bt.create(t);
  } catch (l) {
    throw new er(l);
  }
  return await i.resetTraceProcessor(), {
    parse: (l) => i.parse(l),
    notifyEof: () => i.notifyEof(),
    async query(l) {
      const s = await i.query(l), r = s.columns(), n = {};
      for (const o of r) n[o] = j;
      const h = r.map(() => []);
      for (const o = s.iter(n); o.valid(); o.next())
        r.forEach((c, d) => h[d].push(o.get(c)));
      return {
        columns: r.map((o, c) => ({ name: o, values: h[c] })),
        rowCount: s.numRows()
      };
    },
    dispose: () => i.dispose()
  };
}
function nr({ model: a, el: t }) {
  let i;
  const l = document.createElement("div");
  l.style.fontFamily = "system-ui, sans-serif", l.style.fontSize = "0.9em";
  const s = document.createElement("input");
  s.type = "file", s.accept = ".perfetto_trace,.pftrace,.json,.gz";
  const r = document.createElement("div");
  r.style.marginTop = "0.5em", r.style.color = "#555", r.textContent = "Pick a trace file to begin.", l.append(s, r), t.appendChild(l);
  function n(d) {
    r.textContent = d, a.set("status", d), a.save_changes();
  }
  function h(d) {
    a.set("error", d instanceof Error ? d.message : String(d)), a.save_changes();
  }
  async function o() {
    if (i === void 0) {
      const d = a.get("wasm_base_url") || he;
      i = await rr({ wasmBaseUrl: d });
    }
    return i;
  }
  s.addEventListener("change", async () => {
    const d = s.files?.[0];
    if (d) {
      n(`Loading ${d.name}…`);
      try {
        const u = await o(), f = new Uint8Array(await d.arrayBuffer());
        await u.parse(f), await u.notifyEof(), n(`Loaded ${d.name}. Set .sql (or call run_query()) from Python to query it.`), a.set("error", ""), a.save_changes();
      } catch (u) {
        n("Failed to load trace — see .error"), h(u);
      }
    }
  });
  async function c() {
    const d = a.get("sql");
    if (d) {
      n("Running query…");
      try {
        const f = await (await o()).query(d), w = f.columns.map((g) => ({
          name: g.name,
          values: g.values.map(
            (E) => typeof E == "bigint" ? E.toString() : E instanceof Uint8Array ? Array.from(E) : E
          )
        }));
        a.set("columns_json", JSON.stringify(w)), a.set("row_count", f.rowCount), a.set("error", ""), n(`${f.rowCount} row(s).`), a.save_changes();
      } catch (u) {
        a.set("columns_json", "[]"), a.set("row_count", 0), n("Query failed — see .error"), h(u);
      }
    }
  }
  return a.on("change:_query_seq", c), () => {
    i?.dispose();
  };
}
const ir = { render: nr };
export {
  ir as default
};

/*
 * Science Learning Lab – simulation bridge, protocol v1.
 * Optional helper for simulation authors. Any code that speaks the protocol
 * (docs/SIMULATION_PROTOCOL.md) is accepted; this file only saves work.
 *
 * Classic script (no modules) so it runs in a sandboxed, opaque-origin iframe.
 * Each simulation package ships its own copy, so packages stay self-contained and immutable.
 *
 * Usage:
 *   var bridge = SLL.connect({ simId, version, capabilityLevel: 3,
 *     onInit: function (init) {},        // { sessionId, locale, params, lockedParams }
 *     onSetParams: function (params) {} });
 *   bridge.reportObservables({ measurementsCount: 3 });
 *   bridge.emit("experimentCompleted", { trials: 5 });
 */
(function (root) {
  "use strict";

  function isObject(x) {
    return x !== null && typeof x === "object" && !Array.isArray(x);
  }

  function connect(options) {
    var parent = root.parent;
    var standalone = !parent || parent === root;

    function send(type, payload) {
      if (standalone) return;
      // Target "*" is required: a sandboxed frame cannot name the host origin.
      // The host validates every message (source window, schema, rate).
      parent.postMessage({ sll: 1, type: type, payload: payload }, "*");
    }

    // "ready" is repeated until "init" arrives: the simulation may load before the host is listening.
    var readyTimer = null;
    var readyTries = 0;

    root.addEventListener("message", function (event) {
      if (event.source !== parent) return;
      var msg = event.data;
      if (!isObject(msg) || msg.sll !== 1 || !isObject(msg.payload)) return;
      if (msg.type === "init" && readyTimer !== null) {
        root.clearInterval(readyTimer);
        readyTimer = null;
      }
      if (msg.type === "init") {
        // The host is listening now: report the current height even if it has not changed.
        root.setTimeout(function () { lastHeight = 0; resize(); }, 0);
      }
      if (msg.type === "init" && typeof options.onInit === "function") {
        options.onInit({
          sessionId: String(msg.payload.sessionId || ""),
          locale: msg.payload.locale === "en" ? "en" : "he",
          params: isObject(msg.payload.params) ? msg.payload.params : {},
          lockedParams: Array.isArray(msg.payload.lockedParams) ? msg.payload.lockedParams : [],
        });
      } else if (msg.type === "setParams" && typeof options.onSetParams === "function") {
        options.onSetParams(isObject(msg.payload.params) ? msg.payload.params : {});
      }
    });

    function sendReady() {
      send("ready", {
        simId: options.simId,
        version: options.version,
        capabilityLevel: options.capabilityLevel,
      });
    }
    sendReady();
    if (!standalone) {
      readyTimer = root.setInterval(function () {
        readyTries += 1;
        if (readyTries > 40) {
          root.clearInterval(readyTimer);
          readyTimer = null;
          return;
        }
        sendReady();
      }, 250);
    }

    var lastHeight = 0;
    // Measure the content (body), not the document: the document is never shorter than the frame,
    // so measuring it would let the frame grow but never shrink.
    function contentHeight() {
      var body = root.document.body;
      var style = root.getComputedStyle(body);
      return body.getBoundingClientRect().height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
    }
    function resize() {
      var h = Math.ceil(contentHeight());
      if (Math.abs(h - lastHeight) > 4) {
        lastHeight = h;
        send("resize", { height: Math.max(200, Math.min(4000, h)) });
      }
    }
    if (typeof root.ResizeObserver === "function") {
      new root.ResizeObserver(resize).observe(root.document.body);
    }

    return {
      standalone: standalone,
      reportObservables: function (values) {
        send("observables", { values: values });
      },
      emit: function (name, data) {
        send("event", data ? { name: name, data: data } : { name: name });
      },
      resize: resize,
    };
  }

  root.SLL = { connect: connect, protocolVersion: 1 };
})(typeof window !== "undefined" ? window : this);

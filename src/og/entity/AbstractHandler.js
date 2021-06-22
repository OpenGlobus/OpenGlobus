import { spliceTypedArray } from "../utils/shared.js";

export class AbstractHandler {
    constructor(entityCollection, name) {
        this.n = name;
        /**
         * Picking rendering option.
         * @public
         * @type {boolean}
         */
        this.pickingEnabled = true;

        this._entityCollection = entityCollection;

        /**
         * Renderer.
         * @protected
         * @type {og.Renderer}
         */
        this._renderer = null;

        this[this.n] = [];

        this._buffers = new Map();

        this._buffersUpdateCallbacks = [];

    }

    initBufferDetection() {
        this._changedBuffers = new Array(this._buffersUpdateCallbacks.length);
    }

    addBuffer(name, index, itemSize, length, updateCallback) {
        this._buffers.set(index, { itemSize, name, length });
        this[`_${name}Arr`] = new Float32Array();
        this[`_${name}Buffer`] = null;
        this[`create${name}Buffer`] = updateCallback || (() => {
            var h = this._renderer.handler;
            h.gl.deleteBuffer(this[`_${name}Buffer`]);
            this[`_${name}Buffer`] = h.createArrayBuffer(this[`_${name}Arr`], itemSize, this[`_${name}Arr`].length / itemSize);

        });
        this._buffersUpdateCallbacks[index] = this[`create${name}Buffer`];
    }

    static setParametersToArray(arr, index, length, itemSize, ...params) {
        const currIndex = index * length;
        for (let i = currIndex; i < currIndex + length; i++) {
            arr[i] = params[i % itemSize];
        }
    }

    initProgram() {

    }

    setRenderer(renderer) {
        this._renderer = renderer;
        this.initProgram();
    }

    setRenderNode (renderNode) {
        this._renderer = renderNode.renderer;
        this.initProgram();
    }

    refresh() {
        var i = this._changedBuffers.length;
        while (i--) {
            this._changedBuffers[i] = true;
        }
    }

    clear() {
        for (const [b, o] of this._buffers) {
            this[`_${o.name}Arr`] = null;
            this[`_${o.name}Arr`] = new Float32Array();
        }

        this._removeInstances();
        this._deleteBuffers();
        this.refresh();
    }

    _deleteBuffers() {
        if (this._renderer) {
            var gl = this._renderer.handler.gl;

            for (const [b, o] of this._buffers) {
                gl.deleteBuffer(this[`_${o.name}Arr`]);
                this[`_${p.name}Arr`] = new Float32Array();
            }
        }
    }

    update() {
        if (this._renderer) {
            var i = this._changedBuffers.length;
            while (i--) {
                if (this._changedBuffers[i]) {
                    this._buffersUpdateCallbacks[i].call(this);
                    this._changedBuffers[i] = false;
                }
            }
        }
    }

    add(instance) {
        if (instance._handlerIndex === -1) {
            instance._handler = this;
            instance._handlerIndex = this[this.n].length;
            this[this.n].push(instance);
            this._addInstanceToArrays(instance);
            this.refresh();
        }
    }

    remove(instance) {
        if (instance._handler && this.__staticId === instance._handler.__staticId) {
            this._removeInstanceFromArrays(instance);
        }
    }

    _addInstanceToArrays(instance) {
    }

    _removeInstanceFromArrays(instance) {
        var instI = instance._handlerIndex;

        this[this.n].splice(instI, 1);

        for (const [b, o] of this._buffers) {
            const i = instI * o.length;
            this[`_${o.name}Arr`] = spliceTypedArray(this[`_${o.name}Arr`], i, o.length);
        }

        this.reindexInstancesArray(instI);
        this.refresh();

        instance._handlerIndex = -1;
        instance._handler = null;
    }

    _removeInstances() {
        var i = this[this.n].length;
        while (i--) {
            var inst = this[this.n][i];
            inst._handlerIndex = -1;
            inst._handler = null;
        }
        this[this.n].length = 0;
        this[this.n] = [];
    }

    _displayPASS() {
    }

    _pickingPASS() {
    }

    draw() {
        if (this[this.n].length) {
            this.update();
            this._displayPASS();
        }
    }

    drawPicking() {
        if (this[this.n].length && this.pickingEnabled) {
            this._pickingPASS();
        }
    }

    reindexInstancesArray(startIndex) {
        var inst = this[this.n];
        for (var i = startIndex; i < inst.length; i++) {
            inst[i]._handlerIndex = i;
        }
    }
}
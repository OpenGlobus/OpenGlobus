/**
 * @module og/entity/BillboardHandler
 */

'use strict';

import * as shaders from '../shaders/billboard.js';
import { concatTypedArrays } from '../utils/shared.js';
import { AbstractHandler } from "./AbstractHandler.js";

const PICKINGCOLOR_BUFFER = 0;
const POSITION_HIGH_BUFFER = 1;
const POSITION_LOW_BUFFER = 2;
const SIZE_BUFFER = 3;
const OFFSET_BUFFER = 4;
const RGBA_BUFFER = 5;
const ROTATION_BUFFER = 6;
const TEXCOORD_BUFFER = 7;
const VERTEX_BUFFER = 8;
const ALIGNEDAXIS_BUFFER = 9;

/*
 * og.BillboardHandler
 *
 *
 */
class BillboardHandler extends AbstractHandler {
    constructor(entityCollection) {
        super(entityCollection, '_billboards');

        this.addBuffer('texCoord', TEXCOORD_BUFFER, 2, 12);
        this.addBuffer('vertex', VERTEX_BUFFER, 2, 12);
        this.addBuffer('positionHigh', POSITION_HIGH_BUFFER, 3, 18, this.createPositionHighBuffer);
        this.addBuffer('positionLow', POSITION_LOW_BUFFER, 3, 18, this.createPositionLowBuffer);
        this.addBuffer('size', SIZE_BUFFER, 2, 12);
        this.addBuffer('offset', OFFSET_BUFFER, 3, 18);
        this.addBuffer('rgba', RGBA_BUFFER, 4, 24);
        this.addBuffer('rotation', ROTATION_BUFFER, 1, 6);
        this.addBuffer('alignedAxis', ALIGNEDAXIS_BUFFER, 3, 18);
        this.addBuffer('pickingColor', PICKINGCOLOR_BUFFER, 3, 18);

        this.initBufferDetection();
        this.__staticId = BillboardHandler._staticCounter++;
    }

    createPositionLowBuffer() {
        let h = this._renderer.handler,
            numItems = this._positionLowArr.length / 3;

        if (!this._positionLowBuffer || this._positionLowBuffer.numItems !== numItems) {
            h.gl.deleteBuffer(this._positionLowBuffer);
            this._positionLowBuffer = h.createStreamArrayBuffer(3, numItems);
        }

        h.setStreamArrayBuffer(this._positionLowBuffer, this._positionLowArr);
    }

    createPositionHighBuffer() {
        let h = this._renderer.handler,
            numItems = this._positionHighArr.length / 3;

        if (!this._positionHighBuffer || this._positionHighBuffer.numItems !== numItems) {
            h.gl.deleteBuffer(this._positionHighBuffer);
            this._positionHighBuffer = h.createStreamArrayBuffer(3, numItems);
        }

        h.setStreamArrayBuffer(this._positionHighBuffer, this._positionHighArr);
    }

    static get _staticCounter() {
        if (!this._counter && this._counter !== 0) {
            this._counter = 0;
        }
        return this._counter;
    }

    static set _staticCounter(n) {
        this._counter = n;
    }

    static concArr(dest, curr) {
        for (var i = 0; i < curr.length; i++) {
            dest.push(curr[i]);
        }
    }

    initProgram() {
        if (this._renderer.handler) {

            if (!this._renderer.handler.programs.billboard) {
                this._renderer.handler.addProgram(shaders.billboard_screen());
            }

            if (!this._renderer.handler.programs.billboardPicking) {
                this._renderer.handler.addProgram(shaders.billboardPicking());
            }
        }
    }

    _addInstanceToArrays(billboard) {
        if (billboard._visibility) {
            this._vertexArr = concatTypedArrays(this._vertexArr, [-0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5]);
        } else {
            this._vertexArr = concatTypedArrays(this._vertexArr, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        }

        this._texCoordArr = concatTypedArrays(this._texCoordArr, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

        var x = billboard._positionHigh.x, y = billboard._positionHigh.y, z = billboard._positionHigh.z, w;
        this._positionHighArr = concatTypedArrays(this._positionHighArr, [x, y, z, x, y, z, x, y, z, x, y, z, x, y, z, x, y, z]);

        x = billboard._positionLow.x;
        y = billboard._positionLow.y;
        z = billboard._positionLow.z;
        this._positionLowArr = concatTypedArrays(this._positionLowArr, [x, y, z, x, y, z, x, y, z, x, y, z, x, y, z, x, y, z]);

        x = billboard._width;
        y = billboard._height;
        this._sizeArr = concatTypedArrays(this._sizeArr, [x, y, x, y, x, y, x, y, x, y, x, y]);

        x = billboard._offset.x;
        y = billboard._offset.y;
        z = billboard._offset.z;
        this._offsetArr = concatTypedArrays(this._offsetArr, [x, y, z, x, y, z, x, y, z, x, y, z, x, y, z, x, y, z]);

        x = billboard._color.x;
        y = billboard._color.y;
        z = billboard._color.z;
        w = billboard._color.w;
        this._rgbaArr = concatTypedArrays(this._rgbaArr, [x, y, z, w, x, y, z, w, x, y, z, w, x, y, z, w, x, y, z, w, x, y, z, w]);

        x = billboard._rotation;
        this._rotationArr = concatTypedArrays(this._rotationArr, [x, x, x, x, x, x]);

        x = billboard._alignedAxis.x;
        y = billboard._alignedAxis.y;
        z = billboard._alignedAxis.z;
        this._alignedAxisArr = concatTypedArrays(this._alignedAxisArr, [x, y, z, x, y, z, x, y, z, x, y, z, x, y, z, x, y, z]);

        x = billboard._entity._pickingColor.x / 255;
        y = billboard._entity._pickingColor.y / 255;
        z = billboard._entity._pickingColor.z / 255;
        this._pickingColorArr = concatTypedArrays(this._pickingColorArr, [x, y, z, x, y, z, x, y, z, x, y, z, x, y, z, x, y, z]);
    }

    _displayPASS() {
        var r = this._renderer;
        var h = r.handler;
        h.programs.billboard.activate();
        var sh = h.programs.billboard._program;
        var sha = sh.attributes,
            shu = sh.uniforms;

        var gl = h.gl,
            ec = this._entityCollection;

        gl.polygonOffset(ec.polygonOffsetFactor, ec.polygonOffsetUnits);

        gl.uniform1i(shu.u_texture, 0);

        gl.uniformMatrix4fv(shu.viewMatrix, false, r.activeCamera._viewMatrix._m);
        gl.uniformMatrix4fv(shu.projectionMatrix, false, r.activeCamera.getProjectionMatrix());

        gl.uniform3fv(shu.eyePositionHigh, r.activeCamera.eyeHigh);
        gl.uniform3fv(shu.eyePositionLow, r.activeCamera.eyeLow);

        gl.uniform3fv(shu.uScaleByDistance, ec.scaleByDistance);

        gl.uniform1f(shu.uOpacity, ec._fadingOpacity);

        gl.uniform2fv(shu.uFloatParams, [ec.renderNode._planetRadius2 || 0, r.activeCamera._tanViewAngle_hradOneByHeight]);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordBuffer);
        gl.vertexAttribPointer(sha.a_texCoord, this._texCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.vertexAttribPointer(sha.a_vertices, this._vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionHighBuffer);
        gl.vertexAttribPointer(sha.a_positionsHigh, this._positionHighBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionLowBuffer);
        gl.vertexAttribPointer(sha.a_positionsLow, this._positionLowBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._rgbaBuffer);
        gl.vertexAttribPointer(sha.a_rgba, this._rgbaBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._sizeBuffer);
        gl.vertexAttribPointer(sha.a_size, this._sizeBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._offsetBuffer);
        gl.vertexAttribPointer(sha.a_offset, this._offsetBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._rotationBuffer);
        gl.vertexAttribPointer(sha.a_rotation, this._rotationBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._alignedAxisBuffer);
        gl.vertexAttribPointer(sha.a_alignedAxis, this._alignedAxisBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, this._vertexBuffer.numItems);
    }

    _pickingPASS() {
        var r = this._renderer;
        var h = r.handler;
        h.programs.billboardPicking.activate();
        var sh = h.programs.billboardPicking._program;
        var sha = sh.attributes,
            shu = sh.uniforms;

        var gl = h.gl,
            ec = this._entityCollection;

        gl.polygonOffset(ec.polygonOffsetFactor, ec.polygonOffsetUnits);

        gl.uniformMatrix4fv(shu.viewMatrix, false, r.activeCamera._viewMatrix._m);
        gl.uniformMatrix4fv(shu.projectionMatrix, false, r.activeCamera.getProjectionMatrix());

        gl.uniform3fv(shu.eyePositionHigh, r.activeCamera.eyeHigh);
        gl.uniform3fv(shu.eyePositionLow, r.activeCamera.eyeLow);

        gl.uniform3fv(shu.uScaleByDistance, ec.scaleByDistance);

        gl.uniform1f(shu.uOpacity, ec._fadingOpacity);

        gl.uniform1f(shu.pickingScale, ec.pickingScale);

        gl.uniform2fv(shu.uFloatParams, [ec.renderNode._planetRadius2 || 0, r.activeCamera._tanViewAngle_hradOneByHeight]);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.vertexAttribPointer(sha.a_vertices, this._vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionHighBuffer);
        gl.vertexAttribPointer(sha.a_positionsHigh, this._positionHighBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionLowBuffer);
        gl.vertexAttribPointer(sha.a_positionsLow, this._positionLowBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._pickingColorBuffer);
        gl.vertexAttribPointer(sha.a_pickingColor, this._pickingColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._sizeBuffer);
        gl.vertexAttribPointer(sha.a_size, this._sizeBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._offsetBuffer);
        gl.vertexAttribPointer(sha.a_offset, this._offsetBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._rotationBuffer);
        gl.vertexAttribPointer(sha.a_rotation, this._rotationBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._alignedAxisBuffer);
        gl.vertexAttribPointer(sha.a_alignedAxis, this._alignedAxisBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, this._vertexBuffer.numItems);
    };

    setPositionArr(index, positionHigh, positionLow) {
        AbstractHandler.setParametersToArray(
            this._positionHighArr,
            index,
            18, 3,
            positionHigh.x,
            positionHigh.y,
            positionHigh.z
        );
        this._changedBuffers[POSITION_HIGH_BUFFER] = true;

        AbstractHandler.setParametersToArray(
            this._positionLowArr,
            index,
            18,
            3,
            positionLow.x,
            positionLow.y,
            positionLow.z
        );

        this._changedBuffers[POSITION_LOW_BUFFER] = true;
    }

    setPickingColorArr(index, color) {

        AbstractHandler.setParametersToArray(
            this._pickingColorArr,
            index,
            18,
            3,
            color.x / 255,
            color.y / 255,
            color.z / 255);

        this._changedBuffers[PICKINGCOLOR_BUFFER] = true;
    }

    setSizeArr(index, width, height) {
        AbstractHandler.setParametersToArray(
            this._sizeArr,
            index,
            12,
            3,
            width,
            height
        );

        this._changedBuffers[SIZE_BUFFER] = true;
    }

    setOffsetArr(index, offset) {

        AbstractHandler.setParametersToArray(
            this._offsetArr,
            index,
            18,
            3,
            offset.x,
            offset.y,
            offset.z
        );

        this._changedBuffers[OFFSET_BUFFER] = true;
    }

    setRgbaArr(index, rgba) {
        AbstractHandler.setParametersToArray(
            this._rgbaArr,
            index,
            24,
            4,
            rgba.x,
            rgba.y,
            rgba.z,
            rgba.w
        );
        this._changedBuffers[RGBA_BUFFER] = true;
    }

    setRotationArr(index, rotation) {

        AbstractHandler.setParametersToArray(
            this._rotationArr,
            index,
            6,
            1,
            rotation
        );
        this._changedBuffers[ROTATION_BUFFER] = true;
    }

    setTexCoordArr(index, tcoordArr) {
        AbstractHandler.setParametersToArray(
            this._texCoordArr,
            index,
            12,
            12,
            ...tcoordArr
        );
        this._changedBuffers[TEXCOORD_BUFFER] = true;
    }

    setVisibility(index, visibility) {
        var vArr;
        if (visibility) {
            vArr = [-0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5];
        } else {
            vArr = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }
        this.setVertexArr(index, vArr);
    }

    setVertexArr(index, vertexArr) {

        AbstractHandler.setParametersToArray(
            this._texCoordArr,
            index,
            12,
            12,
            ...tcoordArr
        );

        this._changedBuffers[VERTEX_BUFFER] = true;
    }

    setAlignedAxisArr(index, alignedAxis) {
        AbstractHandler.setParametersToArray(
            this._alignedAxisArr,
            index,
            18,
            3,
            alignedAxis.x,
            alignedAxis.y,
            alignedAxis.z
        );
        this._changedBuffers[ALIGNEDAXIS_BUFFER] = true;
    }

    refreshTexCoordsArr() {
        var bc = this._entityCollection;
        if (bc && this._renderer) {
            var ta = this._renderer.billboardsTextureAtlas;
            for (var i = 0; i < this._billboards.length; i++) {
                var bi = this._billboards[i];
                var img = bi._image;
                if (img) {
                    var imageNode = ta.nodes[bi._image.__nodeIndex];
                    if (imageNode) {
                        this.setTexCoordArr(bi._handlerIndex, imageNode.texCoords);
                    }
                }
            }
        }
    }
};

export { BillboardHandler };

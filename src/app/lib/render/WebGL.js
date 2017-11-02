import Util from './../Util.js';
import $ from 'jquery';
import THREE from 'three';
import postRenderVertex from './shaders/postRender/vertex.glsl';
import postRenderFragment from './shaders/postRender/fragment.glsl';

var glm = require('gl-matrix');

const getShader = function( type, shaderImport) {
    var shader = this._private.gl.createShader(type);
    this._private.gl.shaderSource(shader, shaderImport);
    this._private.gl.compileShader(shader);
    if (!this._private.gl.getShaderParameter(shader, this._private.gl.COMPILE_STATUS)) {
        console.log('shader error');
        alert(this._private.gl.getShaderInfoLog(shader));
        console.log(this._private.gl.getShaderInfoLog(shader));
    }
    return shader;
};

const initGl = function(){
    const self = this._private;
    self.gl = self.canvas.getContext("webgl", { antialias: true });
    self.gl.viewport(0, 0, self.canvas.width, self.canvas.height);
    self.gl.enable(self.gl.BLEND);
    self.gl.blendFunc(self.gl.SRC_ALPHA, self.gl.ONE_MINUS_SRC_ALPHA);
    self.gl.enable(self.gl.CULL_FACE);
    self.gl.cullFace(self.gl.BACK);

    self.rttFramebuffer = self.gl.createFramebuffer();
    self.gl.bindFramebuffer(self.gl.FRAMEBUFFER,self.rttFramebuffer);
    self.rttFramebuffer.width = self.rttFramebuffer.height = self.rttFramebuffer.clientWidth = self.rttFramebuffer.clientHeight = 1024;

    self.rttTexture = self.gl.createTexture();
    self.gl.bindTexture(self.gl.TEXTURE_2D, self.rttTexture);
    self.gl.texParameteri(self.gl.TEXTURE_2D,self.gl.TEXTURE_MAG_FILTER,self.gl.LINEAR);
    self.gl.texParameteri(self.gl.TEXTURE_2D,self.gl.TEXTURE_MIN_FILTER,self.gl.LINEAR);
    self.gl.texImage2D(self.gl.TEXTURE_2D, 0, self.gl.RGBA, self.rttFramebuffer.width, self.rttFramebuffer.height, 0, self.gl.RGBA, self.gl.UNSIGNED_BYTE, null);

    self.renderbuffer = self.gl.createRenderbuffer();
    self.gl.bindRenderbuffer(self.gl.RENDERBUFFER, self.renderbuffer);
    self.gl.renderbufferStorage(self.gl.RENDERBUFFER, self.gl.DEPTH_COMPONENT16, self.rttFramebuffer.width, self.rttFramebuffer.height);

    self.gl.framebufferTexture2D(self.gl.FRAMEBUFFER, self.gl.COLOR_ATTACHMENT0, self.gl.TEXTURE_2D, self.rttTexture, 0);
    self.gl.framebufferRenderbuffer(self.gl.FRAMEBUFFER, self.gl.DEPTH_ATTACHMENT, self.gl.RENDERBUFFER, self.renderbuffer);

    self.gl.bindTexture(self.gl.TEXTURE_2D, null);
    self.gl.bindRenderbuffer(self.gl.RENDERBUFFER, null);
    self.gl.bindFramebuffer(self.gl.FRAMEBUFFER, null);

    this.createShader('postRender', postRenderVertex, postRenderFragment, [
        {name: 'a_position', size: 4, count: 2, type: 'FLOAT'},
        {name: 'a_uv', size: 4, count: 2, type: 'FLOAT'}
    ]);

    $(window).on('resize',function(){
        self.canvas.width = self.canvas.clientWidth;
        self.canvas.height = self.canvas.clientHeight;
    });
};

const initScene = function(camera,lookAt,up,clearColor=[0.0,0.0,0.0],mode=0,renderTargetMetrics=null){
    const self = this._private;
    renderTargetMetrics = renderTargetMetrics || self.canvas;
    let vpX=0,vpW=renderTargetMetrics.width/2,vpCW = renderTargetMetrics.clientWidth/2;
    if (mode==2)
        vpX = renderTargetMetrics.width/2;
    if (mode==0) {
        vpW = renderTargetMetrics.width;
        vpCW = renderTargetMetrics.clientWidth;
    }

    self.gl.viewport(vpX,0,vpW,renderTargetMetrics.height);
    self.gl.clearColor(clearColor[0],clearColor[1],clearColor[2], 1.0);

    self.mvMatrix = makeView(lookAt,camera,up);
    self.pMatrix = makePerspective(Util.deg2Rad(mode?70:60),vpCW / renderTargetMetrics.clientHeight,0.1,100)

    self.gl.enable(self.gl.DEPTH_TEST);
    if (mode<2)
        self.gl.clear(self.gl.COLOR_BUFFER_BIT | self.gl.DEPTH_BUFFER_BIT);
};

const makePerspective = function(fieldOfViewInRadians, aspect, near, far){
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);
    return [
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0
    ];
};

const makeInversePerspective = function(fieldOfViewInRadians, aspect, near, far){
    var m4 = new THREE.Matrix4();
    m4.set(makePerspective(fieldOfViewInRadians, aspect, near, far));
    var nm4 = new THREE.Matrix4();
    return nm4.getInverse(m4).elements;
};

const makeView = function(lookAt, camera, up){
    let zaxis = glm.vec3.create();
    glm.vec3.scale(zaxis,lookAt,-1);
    //glm.vec3.sub(zaxis,lookAt,camera);
    glm.vec3.normalize(zaxis,zaxis);
    let xaxis = glm.vec3.create();
    glm.vec3.cross(xaxis,up,zaxis);
    glm.vec3.normalize(xaxis,xaxis);
    let yaxis = glm.vec3.create();
    glm.vec3.cross(yaxis,zaxis,xaxis);

    return [
        xaxis[0],  yaxis[0],  zaxis[0],  0,
        xaxis[1],  yaxis[1],  zaxis[1],  0,
        xaxis[2],  yaxis[2],  zaxis[2],  0,
        -glm.vec3.dot(xaxis,camera), -glm.vec3.dot(yaxis,camera), -glm.vec3.dot(zaxis,camera), 1
    ];
};

const makeInverseView = function(lookAt, camera, up){
    var m4 = new THREE.Matrix4();
    m4.set(makeView(lookAt, camera, up));
    var nm4 = new THREE.Matrix4();
    return nm4.getInverse(m4).elements;
};

const makeTranslation = function(tx, ty, tz){
    return [
        1,  0,  0,  0,
        0,  1,  0,  0,
        0,  0,  1,  0,
        tx, ty, tz,  1
    ];
};

const initBuffer = function(glELEMENT_ARRAY_BUFFER, data){
    const self = this._private;
    var buf = self.gl.createBuffer();
    self.gl.bindBuffer(glELEMENT_ARRAY_BUFFER, buf);
    self.gl.bufferData(glELEMENT_ARRAY_BUFFER, data, self.gl.DYNAMIC_DRAW);
    return buf;
};

const initBuffers = function(shaderName, vtx, idx=null, textures=[],uniforms={}){
    const self = this._private;
    if (typeof shaderName=='string') {
        var shader = self.shaders[shaderName];
    }
    else
        var shader = shaderName;
    var shaderProgram = shader.shader;

    if (typeof shaderName=='string')
        self.gl.useProgram(shaderProgram);
    self.gl.uniformMatrix4fv(shaderProgram.pMUniform, false, new Float32Array(self.pMatrix));
    self.gl.uniformMatrix4fv(shaderProgram.mvMUniform, false, new Float32Array(self.mvMatrix));

    textures.forEach((tex,ind)=>{
        self.gl.activeTexture(self.gl['TEXTURE'+ind]);
        self.gl.bindTexture(self.gl.TEXTURE_2D, typeof tex=='string' ? self.textures[tex] : tex);
        self.gl.uniform1i(self.gl.getUniformLocation(shaderProgram,'tex'+ind),ind);
    });

    self.vbuf = initBuffer.call(this,self.gl.ARRAY_BUFFER, vtx);
    if (idx)
        self.ibuf = initBuffer.call(this, self.gl.ELEMENT_ARRAY_BUFFER, idx);
    var cumulative = 0;
    shader.attrs.forEach(attr=>{
        self.gl.enableVertexAttribArray(shaderProgram[attr.name+'Attrib']);
        self.gl.vertexAttribPointer(shaderProgram[attr.name+'Attrib'], attr.count, self.gl[attr.type], false, shader.total, cumulative);
        cumulative+=(attr.size*attr.count);
    });
    shader.uniforms.forEach(uniform=>{
        self.gl['uniform'+uniform.type](shaderProgram[uniform.name+'Uniform'],typeof uniforms[uniform.name]=='undefined' ? uniform.value : uniforms[uniform.name]);
    });
};

const unbindBuffers = function(shaderName){
    const self = this._private;
    self.gl.bindBuffer(self.gl.ARRAY_BUFFER, null);
    self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, null);
    self.gl.bindTexture(self.gl.TEXTURE_2D,null);
    self.gl.deleteBuffer(self.vbuf);

    if (typeof shaderName=='string') {
        var shader = self.shaders[shaderName];
    }
    else
        var shader = shaderName;
    var shaderProgram = shader.shader;
    shader.attrs.forEach(attr=> {
        self.gl.disableVertexAttribArray(shaderProgram[attr.name + 'Attrib']);
    });
};

export default class WebGL {
    constructor(showFPS=false) {
        this._private = {
            gl: null,
            pMatrix: null,
            mvMatrix: null,
            vbuf: null,
            ibuf: null,
            shaders: [],
            textures:[],
            showFPS,
            fps:0,
            dataTextures:{},
            canvas: document.createElement('canvas')
        };
        if (showFPS) {
            $('body').prepend('<div id="fps" style="position:absolute;width:50px;padding:8px;text-align:center;background-color:rgba(128,128,128,0.5);border:#888 1px solid;font-weight:700;color:#fff;"></div>');
            window.setInterval((function(){
                document.getElementById('fps').innerHTML = Math.ceil(this._private.fps);
                this._private.fps = 0;
            }).bind(this),1000);
        }
        this._private.canvas.width = window.innerWidth;
        this._private.canvas.height = window.innerHeight;
        document.body.appendChild(this._private.canvas);
        initGl.call(this);
    }

    getCanvas() {
        return this._private.canvas;
    }

    createShader(shaderName, vertexShader, fragmentShader, attributes, uniforms=[]) {
        const self = this._private;
        var _vertexShader = getShader.call(this, self.gl.VERTEX_SHADER, vertexShader);
        var _fragmentShader = getShader.call(this, self.gl.FRAGMENT_SHADER, fragmentShader);
        var shaderProgram = self.gl.createProgram();
        self.shaders[shaderName] = {shader:shaderProgram,attrs:attributes,uniforms} ;
        self.gl.attachShader(shaderProgram, _vertexShader);
        self.gl.attachShader(shaderProgram, _fragmentShader);
        self.gl.linkProgram(shaderProgram);
        var total = 0;
        attributes.forEach(attr=>{
            total+=(attr.size*attr.count);
            shaderProgram[attr.name+'Attrib'] = self.gl.getAttribLocation(shaderProgram, attr.name);
            //self.gl.enableVertexAttribArray(shaderProgram[attr.name+'Attrib']);
        });
        uniforms.forEach(uniform=>{
            shaderProgram[uniform.name+'Uniform'] = self.gl.getUniformLocation(shaderProgram, uniform.name);
        });
        self.shaders[shaderName].total = total;
        shaderProgram.pMUniform = self.gl.getUniformLocation(shaderProgram, "u_pMatrix");
        shaderProgram.mvMUniform = self.gl.getUniformLocation(shaderProgram, "u_mvMatrix");
    }

    createTexture(name,src,mipMap=true,wrapX=true,wrapY=true,callback){
        const self = this._private;
        const tex = self.gl.createTexture();
        tex.image = new Image();
        tex.image.onload=function() {
            self.gl.bindTexture(self.gl.TEXTURE_2D,tex);
            self.gl.pixelStorei(self.gl.UNPACK_FLIP_Y_WEBGL,true);
            self.gl.texImage2D(self.gl.TEXTURE_2D,0,self.gl.RGBA,self.gl.RGBA,self.gl.UNSIGNED_BYTE, tex.image);
            self.gl.texParameteri(self.gl.TEXTURE_2D,self.gl.TEXTURE_MAG_FILTER,self.gl.LINEAR);
            self.gl.texParameteri(self.gl.TEXTURE_2D,self.gl.TEXTURE_MIN_FILTER,mipMap?self.gl.LINEAR_MIPMAP_NEAREST:self.gl.LINEAR);
            self.gl.texParameteri(self.gl.TEXTURE_2D,wrapX?self.gl.TEXTURE_WRAP_S:self.gl.CLAMP_TO_EDGE,self.gl.REPEAT);
            self.gl.texParameteri(self.gl.TEXTURE_2D,wrapY?self.gl.TEXTURE_WRAP_T:self.gl.CLAMP_TO_EDGE,self.gl.REPEAT);
            if (mipMap)
                self.gl.generateMipmap(self.gl.TEXTURE_2D);
            self.gl.bindTexture(self.gl.TEXTURE_2D,null);
            if (callback)
                callback();
        };
        tex.image.src = src;
        self.textures[name] = tex;
    }

    createDataTexture(name,size){
        const p = this._private;

        p.dataTextures[name] = {
            tex: p.gl.createTexture(),
            name: name,
            size: size,
            buf: new Uint8Array(size * size)
        };

        return p.dataTextures[name].buf;
    }
    updateDataTexture(name){
        const p = this._private;
        const dataTex = p.dataTextures[name];
        const GL = p.gl;

        GL.bindTexture(GL.TEXTURE_2D,dataTex.tex);
        GL.texImage2D(GL.TEXTURE_2D,0,GL.LUMINANCE,dataTex.size,dataTex.size,0,GL.LUMINANCE,GL.UNSIGNED_BYTE, dataTex.buf);
        GL.texParameteri(GL.TEXTURE_2D,GL.TEXTURE_MAG_FILTER,GL.NEAREST);
        GL.texParameteri(GL.TEXTURE_2D,GL.TEXTURE_MIN_FILTER,GL.NEAREST);
        GL.bindTexture(GL.TEXTURE_2D,null);
    }
    attachDataTexture(name,shader,index){
        const p = this._private;
        const dataTex = p.dataTextures[name];
        const GL = p.gl;

        GL.activeTexture(GL['TEXTURE'+index]);
        GL.bindTexture(GL.TEXTURE_2D, dataTex.tex);
        GL.uniform1i(GL.getUniformLocation(shader, 'tex'+index), index);
    }

    renderStart(camera,lookAt,up,clearColor=[0.0,0.0,0.0],mode=0,renderTargetMetrics=null){
        const self = this._private;
        if (self.showFPS && mode<2 && !renderTargetMetrics)
            self.fps++;
        renderTargetMetrics = renderTargetMetrics || self.canvas;
        initScene.call(this,camera,lookAt,up,clearColor,mode,renderTargetMetrics);
    }

    render(shader, primitiveType, vertexBuffer, primitiveCount, offset=0,textures=[],uniforms={},target=null){
        const self = this._private;

        initBuffers.call(this,shader,vertexBuffer,null,textures,uniforms);
        self.gl.drawArrays(self.gl[primitiveType],offset, primitiveCount);
        unbindBuffers.call(this,shader);
    }

    startBarrelCapture(){
        const self = this._private;

        self.gl.bindFramebuffer(self.gl.FRAMEBUFFER, self.rttFramebuffer);
    }

    endBarrelCapture(){
        const self = this._private;

        self.gl.bindFramebuffer(self.gl.FRAMEBUFFER, null);
    }

    renderBarrel(eyeMode){
        const self = this._private;
        if (self.showFPS && eyeMode<2)
            self.fps++;

        initScene.call(this,[0,0,0],[0,0,-1],[0,1,0],[0.0,0.0,0.0],eyeMode);

        let barrel = this.makeBarrelDistortionBuffer();
        let vertexBuffer = new Float32Array(barrel);

        initBuffers.call(this,'postRender',vertexBuffer,null,[self.rttTexture]);
        self.gl.drawArrays(self.gl.TRIANGLES, 0, barrel.length/4);
        unbindBuffers.call(this,'postRender');
    }

    makeBarrelDistortionBuffer(){
        var distortion = new THREE.Vector2( 0.441, 0.156 );
        var geometry = new THREE.PlaneBufferGeometry( 1, 1, 10, 20 ).removeAttribute( 'normal' ).toNonIndexed();

        var positions = geometry.attributes.position.array;
        var uvs = geometry.attributes.uv.array;

        var positions2 = new Float32Array( positions.length * 2 );
        positions2.set( positions );
        positions2.set( positions, positions.length );

        var uvs2 = new Float32Array( uvs.length * 2 );
        uvs2.set( uvs );
        uvs2.set( uvs, uvs.length );

        var vector = new THREE.Vector2();
        var length = positions.length / 3;

        for ( var i = 0, l = positions2.length / 3; i < l; i ++ ) {

            vector.x = positions2[ i * 3 + 0 ];
            vector.y = positions2[ i * 3 + 1 ];

            var dot = vector.dot( vector );
            var scalar = 1.5 + ( distortion.x + distortion.y * dot ) * dot;

            var offset = i < length ? 0 : 1;

            positions2[ i * 3 + 0 ] = ( vector.x / scalar ) * 1.5 - 0.5 + offset;
            positions2[ i * 3 + 1 ] = ( vector.y / scalar ) * 3.0;

            uvs2[ i * 2 ] = ( uvs2[ i * 2 ] + offset ) * 0.5;

        }

        var ret  = [];
        let c = 0;
        for (let n=0;n<positions2.length/3;n++) {
            c++;
            ret.push(positions2[n*3]);
            ret.push(positions2[(n*3)+1]);
            ret.push(uvs2[n*2]);
            ret.push(uvs2[(n*2)+1]);
        }
        return ret;
    }
}

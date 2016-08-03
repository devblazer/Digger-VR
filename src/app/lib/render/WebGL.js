import Util from './../Util.js';
import $ from 'jquery';

const getShader = function( type, shaderImport) {
    var shader = this._private.gl.createShader(type);
    this._private.gl.shaderSource(shader, shaderImport);
    this._private.gl.compileShader(shader);
    return shader;
};

const initGl = function(){
    const self = this._private;
    self.gl = self.canvas.getContext("webgl", { antialias: true });
    self.gl.viewport(0, 0, self.canvas.width, self.canvas.height);
    //self.gl.enable(self.gl.BLEND);
    //self.gl.blendFunc(self.gl.SRC_ALPHA, self.gl.ONE);
    self.gl.enable(self.gl.CULL_FACE);
    self.gl.cullFace(self.gl.BACK);
};

const initScene = function(camera){
    const self = this._private;
    self.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    self.mvMatrix = makeTranslation(-camera[0], -camera[1], -camera[2]);
    self.pMatrix = makePerspective(Util.deg2Rad(60),self.canvas.clientWidth / self.canvas.clientHeight,1,10000)

    self.gl.enable(self.gl.DEPTH_TEST);
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
    self.gl.bufferData(glELEMENT_ARRAY_BUFFER, data, self.gl.STATIC_DRAW);
    return buf;
};

const initBuffers = function(shaderName, vtx, idx=null, textures=[]){
    const self = this._private;
    var shader = self.shaders[shaderName];
    var shaderProgram = shader.shader;

    self.gl.useProgram(shaderProgram);
    self.gl.uniformMatrix4fv(shaderProgram.pMUniform, false, new Float32Array(self.pMatrix));
    self.gl.uniformMatrix4fv(shaderProgram.mvMUniform, false, new Float32Array(self.mvMatrix));

    textures.forEach((tex,ind)=>{
        self.gl.activeTexture(self.gl['TEXTURE'+ind]);
        self.gl.bindTexture(self.gl.TEXTURE_2D, self.textures[tex]);
        self.gl.uniform1i(self.gl.getUniformLocation(shaderProgram,'tex'+ind),ind);
    });

    self.vbuf = initBuffer.call(this,self.gl.ARRAY_BUFFER, vtx);
    if (idx)
        self.ibuf = initBuffer.call(this, self.gl.ELEMENT_ARRAY_BUFFER, idx);
    var cumulative = 0;
    shader.attrs.forEach(attr=>{
        self.gl.vertexAttribPointer(shaderProgram[attr.name+'Attrib'], attr.count, self.gl[attr.type], false, shader.total, cumulative);
        cumulative+=(attr.size*attr.count);
    });
    shader.uniforms.forEach(uniform=>{
        self.gl['uniform'+uniform.type](shaderProgram[uniform.name+'Uniform'],uniform.value);
    });
};

const unbindBuffers = function(){
    const self = this._private;
    self.gl.bindBuffer(self.gl.ARRAY_BUFFER, null);
    self.gl.bindBuffer(self.gl.ELEMENT_ARRAY_BUFFER, null);
    self.gl.bindTexture(self.gl.TEXTURE_2D,null);
    self.gl.deleteBuffer(self.vbuf);
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
            canvas: document.createElement('canvas')
        };
        if (showFPS) {
            $('body').prepend('<div id="fps" style="position:absolute;width:50px;padding:8px;text-align:center;background-color:rgba(128,128,128,0.5);border:#888 1px solid;font-weight:700;color:#fff;"></div>');
            window.setInterval((function(){
                document.getElementById('fps').innerHTML = this._private.fps;
                this._private.fps = 0;
            }).bind(this),1000);
        }
        this._private.canvas.width = window.innerWidth;
        this._private.canvas.height = window.innerHeight;
        document.body.appendChild(this._private.canvas);
        initGl.call(this);
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
            self.gl.enableVertexAttribArray(shaderProgram[attr.name+'Attrib']);
        });
        uniforms.forEach(uniform=>{
            shaderProgram[uniform.name+'Uniform'] = self.gl.getUniformLocation(shaderProgram, uniform.name);
        });
        self.shaders[shaderName].total = total;
        shaderProgram.pMUniform = self.gl.getUniformLocation(shaderProgram, "u_pMatrix");
        shaderProgram.mvMUniform = self.gl.getUniformLocation(shaderProgram, "u_mvMatrix");
    }

    createTexture(name,src,wrapX=true,wrapY=true,callback){
        const self = this._private;
        const tex = self.gl.createTexture();
        tex.image = new Image();
        tex.image.onload=function() {
            self.gl.bindTexture(self.gl.TEXTURE_2D,tex);
            self.gl.pixelStorei(self.gl.UNPACK_FLIP_Y_WEBGL,true);
            self.gl.texImage2D(self.gl.TEXTURE_2D,0,self.gl.RGBA,self.gl.RGBA,self.gl.UNSIGNED_BYTE, tex.image);
            self.gl.texParameteri(self.gl.TEXTURE_2D,self.gl.TEXTURE_MAG_FILTER,self.gl.LINEAR);
            self.gl.texParameteri(self.gl.TEXTURE_2D,self.gl.TEXTURE_MIN_FILTER,self.gl.LINEAR_MIPMAP_NEAREST);
            self.gl.texParameteri(self.gl.TEXTURE_2D,wrapX?self.gl.TEXTURE_WRAP_S:self.gl.CLAMP_TO_EDGE,self.gl.REPEAT);
            self.gl.texParameteri(self.gl.TEXTURE_2D,wrapY?self.gl.TEXTURE_WRAP_T:self.gl.CLAMP_TO_EDGE,self.gl.REPEAT);
            self.gl.generateMipmap(self.gl.TEXTURE_2D);
            self.gl.bindTexture(self.gl.TEXTURE_2D,null);
            if (callback)
                callback();
        };
        tex.image.src = src;
        self.textures[name] = tex;
    }

    renderStart(camera){
        const self = this._private;
        initScene.call(this,camera);
        if (self.showFPS)
            self.fps++;
    }

    render(shader, primitiveType, vertexBuffer, primitiveCount, offset=0,textures=[]){
        const self = this._private;

        initBuffers.call(this,shader,vertexBuffer,null,textures);
        self.gl.drawArrays(self.gl[primitiveType],offset, primitiveCount);
        unbindBuffers.call(this);
    }
}
export default WebGL;
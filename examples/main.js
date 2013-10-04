goog.provide('og.start');

goog.require('og.webgl.Handler');
goog.require('og.Renderer');
goog.require('og.node.Planet');
goog.require('og.layer');
goog.require('og.layer.XYZ');
goog.require('og.layer.WMS');
goog.require('og.terrainProvider.TerrainProvider');
goog.require('og.control.MouseNavigation');
goog.require('og.control.KeyboardNavigation');
goog.require('og.control.LayerSwitcher');
goog.require('og.control.ToggleWireframe');
goog.require('og.control.LoadingSpinner');
goog.require('og.control.MousePosition');
goog.require('og.control.ShowFps');
goog.require('og.ellipsoid.wgs84');
goog.require('og.node.SkyBox');

goog.require('og.shaderProgram.ShaderProgram');
goog.require('og.shaderProgram.types');
goog.require('og.utils');

og.start = function () {

    var planetShader = new og.shaderProgram.ShaderProgram("planet", {
        uniforms: {
            uMVMatrix: { type: og.shaderProgram.types.MAT4 },
            uPMatrix: { type: og.shaderProgram.types.MAT4 },
            texOffset: { type: og.shaderProgram.types.VEC2},
            texScale: { type: og.shaderProgram.types.FLOAT},
            uSampler: { type: og.shaderProgram.types.SAMPLER2D }
        },
        attributes: {
            aVertexPosition: { type: og.shaderProgram.types.VEC3, enableArray: true },
            aTextureCoord: { type: og.shaderProgram.types.VEC2, enableArray: true }
        },
        vertexShader: og.utils.readTextFile("../src/og/shaders/planet_vs.txt"),
        fragmentShader: og.utils.readTextFile("../src/og/shaders/planet_fs.txt")
    });

    var skyboxShader = new og.shaderProgram.ShaderProgram("skybox", {
        uniforms: {
            uMVMatrix: { type: og.shaderProgram.types.MAT4 },
            uPMatrix: { type: og.shaderProgram.types.MAT4 },
            uSampler: { type: og.shaderProgram.types.SAMPLER2D }
        },
        attributes: {
            aVertexPosition: { type: og.shaderProgram.types.VEC3, enableArray: true },
            aTextureCoord: { type: og.shaderProgram.types.VEC2, enableArray: true }
        },
        vertexShader: og.utils.readTextFile("../src/og/shaders/skybox_vs.txt"),
        fragmentShader: og.utils.readTextFile("../src/og/shaders/skybox_fs.txt")
    });


    context = new og.webgl.Handler("canvas");
    context.addShaderProgram(planetShader);
    context.addShaderProgram(skyboxShader);
    context.init();

    renderer = new og.Renderer(context);
    renderer.init();

    var planet = new og.node.Planet("Earth", og.ellipsoid.wgs84);

    var layer = new og.layer.XYZ("OpenStreetMap", { isBaseLayer: true, url: og.layer.MapServersProxy.OSMb.url });
    var satlayer = new og.layer.XYZ("MapQuest Satellite", { isBaseLayer: true, url: og.layer.MapServers.MapQuestSat.url, visibility: true });
    var mqosm = new og.layer.XYZ("MapQuest", { isBaseLayer: true, url: og.layer.MapServers.MapQuest.url });
    var kosmosnim = new og.layer.XYZ("Kosmosnimki", { isBaseLayer: true, url: og.layer.MapServers.Cosmosnimki.url });
    var kray5m = new og.layer.WMS("geoserver:Kray5m", { isBaseLayer: true, url: "http://127.0.0.1/geoserver/gwc/service/", layers: "lem3d:kray5m" });

    var terrain = new og.terrainProvider.TerrainProvider("OpenGlobus", {
        url: og.terrainProvider.TerrainServers.OpenGlobus.url,
        maxZoom: og.terrainProvider.TerrainServers.OpenGlobus.maxZoom,
        minZoom: og.terrainProvider.TerrainServers.OpenGlobus.minZoom
    });

    planet.addLayers([layer, satlayer, mqosm, kosmosnim, kray5m]);
    planet.setBaseLayer(satlayer);
    planet.setTerrainProvider(terrain);

    var skybox = new og.node.SkyBox();

    renderer.addRenderNode(planet);
    renderer.addRenderNode(skybox);
    renderer.addControls([
        new og.control.MouseNavigation({ autoActivate: true }),
        new og.control.KeyboardNavigation({ autoActivate: true }),
        new og.control.ToggleWireframe({ autoActivate: true }),
        new og.control.LoadingSpinner({ autoActivate: true }),
        new og.control.MousePosition({ autoActivate: true }),
	new og.control.LayerSwitcher({ autoActivate: true }),
    	new og.control.ShowFps({ autoActivate: true })

    ]);

    renderer.Start();
};

goog.exportSymbol('og.start', og.start);

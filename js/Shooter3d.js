function Shooter3d(_main){
    var _self = this;

    this.main = _main;
    this.BULLETMOVESPEED = 500;
	this.PROJECTILEDAMAGE = 20;
	this.UNITSIZE = 250;
    this.WALLHEIGHT = this.UNITSIZE / 3,
	this.MOVESPEED = 100;
	this.LOOKSPEED = 0.075;
    this.map =  [ // 1  2  3  4  5  6  7  8  9
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 0
           [1, 1, 0, 0, 0, 0, 0, 1, 1, 1,], // 1
           [1, 1, 0, 0, 2, 0, 0, 0, 0, 1,], // 2
           [1, 0, 0, 0, 0, 2, 0, 0, 0, 1,], // 3
           [1, 0, 0, 2, 0, 0, 2, 0, 0, 1,], // 4
           [1, 0, 0, 0, 2, 0, 0, 0, 1, 1,], // 5
           [1, 1, 1, 0, 0, 0, 0, 1, 1, 1,], // 6
           [1, 1, 1, 0, 0, 1, 0, 0, 1, 1,], // 7
           [1, 1, 1, 1, 1, 1, 0, 0, 1, 1,], // 8
           [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 9
           ];
    this.mapW = this.map.length;
    this.mapH = this.map[0].length;





    this.mouse = { x: 0, y: 0 };
    this.realMouse = { x: 0, y: 0 };
    this.scene = null;
    this.bullets = [];
    this.cam = null;

    //this.panoSpinning = false;
    this.spinIncrement = .3;
    this.spinInterval = 40; //30;
    this.spinIntervalId = 0;
    //this.panoSpinState = "off"; // off, on

    this.renderer = null;
    this.clock = null;
    this.projector = null;
    this.ASPECT = $("#shooter3dHolder").width() / $("#shooter3dHolder").height();
    //this.bulletMaterial = new THREE.MeshBasicMaterial({color: 0x000000, wireframe:false});
    this.bulletMaterial = new THREE.MeshLambertMaterial({color: 0xcc0000});
    
    this.bulletGeo = new THREE.SphereGeometry(2, 12, 12);

    this.init();
    this.animate();
    $(window).resize(function(){
        _self.windowResize.bind(_self);
    });

}

Shooter3d.prototype.addSkyBox = function(){
    //var r = "textures/stPeters/";
    var r = "textures/footballfield/"; // zz
    //var r = "textures/yokohama3/";
				var urls = [ r + "posx.jpg", r + "negx.jpg",
							 r + "posy.jpg", r + "negy.jpg",
							 r + "posz.jpg", r + "negz.jpg" ];

				var textureCube = new THREE.CubeTextureLoader().load( urls );
				textureCube.format = THREE.RGBFormat;
				textureCube.mapping = THREE.CubeReflectionMapping;

    var cubeShader = THREE.ShaderLib[ "cube" ];
    var cubeMaterial = new THREE.ShaderMaterial( {
        fragmentShader: cubeShader.fragmentShader,
        vertexShader: cubeShader.vertexShader,
        uniforms: cubeShader.uniforms,
        depthWrite: false,
        side: THREE.BackSide
    } );

    cubeMaterial.uniforms[ "tCube" ].value = textureCube;

    // Skybox

    cubeMesh = new THREE.Mesh( new THREE.BoxGeometry( 100, 100, 100 ), cubeMaterial );
    this.scene.add( cubeMesh );

}
Shooter3d.prototype.windowResize = function(){
    this.ASPECT = $("#shooter3dHolder").width() / $("#shooter3dHolder").height();
    this.cam.aspect = this.ASPECT;
    this.cam.updateProjectionMatrix();

    this.renderer.setSize( $("#shooter3dHolder").width(), $("#shooter3dHolder").height() );
}
Shooter3d.prototype.animate = function(){
	requestAnimationFrame(this.animate.bind(this));
	this.render();
    //console.log("animate");
}
Shooter3d.prototype.init = function(){
	var _self = this;
    this.clock = new THREE.Clock(); // Used in render() for controls.update()
    this.projector = new THREE.Projector(); // Used in bullet projection
	this.scene = new THREE.Scene(); // Holds all objects in the canvas
	//this.scene.fog = new THREE.FogExp2(0xD6F1FF, 0.0005); // color, density
	
	// Set up camera
	this.cam = new THREE.PerspectiveCamera(70, this.ASPECT, 1, 10000); // FOV, aspect, near, far
	//this.cam.position.y = this.UNITSIZE * .2;
    this.cam.position.set( 0, 0, 0 );
	this.scene.add(this.cam);
	
    if(!this.main.isTouchDevice()){
        // Camera moves with mouse, flies around with WASD/arrow keys
        this.controls = new THREE.FirstPersonControls(this.cam);
        this.controls.movementSpeed = this.MOVESPEED;
        this.controls.lookSpeed = this.LOOKSPEED;
        this.controls.lookVertical = false; // Temporary solution; play on flat surfaces only
        this.controls.noFly = true;
    }
    else{
        this.controls = new THREE.OrbitControls( this.cam );
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10000;
        this.controls.minPolarAngle = Math.PI/2; // radians
        this.controls.maxPolarAngle = Math.PI/2; // radians
    }

	// World objects
	this.setupScene();
	
	// Artificial Intelligence
	//setupAI();
	
	// Handle drawing as WebGL (faster than Canvas but less supported)
	this.renderer = new THREE.WebGLRenderer();
	this.renderer.setSize($("#shooter3dHolder").width(), $("#shooter3dHolder").height());

    this.addSkyBox();
	
	// Add the canvas to the document
	//this.renderer.domElement.style.backgroundColor = '#D6F1FF'; // easier to see
    $("#shooter3dHolder").append(this.renderer.domElement);
	//document.body.appendChild(renderer.domElement);
	
	// Track mouse position so we know where to shoot
	$("#shooter3dHolder").mousemove(function(evt){
        evt.preventDefault();
        _self.mouse.x = (evt.clientX / $("#shooter3dHolder").width()) * 2 - 1;
        _self.mouse.y = - (evt.clientY / $("#shooter3dHolder").height()) * 2 + 1;
        //_self.rotatePano(evt);
        _self.realMouse.x = evt.clientX;
        _self.realMouse.y = evt.clientY;
    });
	
	// Shoot on click
	$("#shooter3dHolder").click(function(e) {
		//e.preventDefault;
		if (e.which === 1) { // Left click only
            console.log("Bullet");
			_self.addBullet();
            //console.log("_self.movieMaterial.playVideo: %o", _self.movieMaterial.playVideo);
            //_self.movieMaterial.playVideo();
		}
	});
}
Shooter3d.prototype.render = function(){
// Update and display
	var delta = this.clock.getDelta(), speed = delta * this.BULLETMOVESPEED;
	var aispeed = delta * this.MOVESPEED;
	this.controls.update(delta); // Move camera
    this.movieMaterial.update();

    for (var i = 0; i < this.girls.length; i++){
        this.girls[i].lookAt(this.cam.position);
        //console.log("this.girls[i] %o", this.girls[i].children[0]);
        if (this.checkGirlCollide(this.girls[i])){
            console.log("HIT!!!");
            //this.bullets.splice(i, 1);
            //this.scene.remove(b);
            continue;
        }

    }
	
	// Update bullets. Walk backwards through the list so we can remove items.
	for (var i = this.bullets.length-1; i >= 0; i--) {
		var b = this.bullets[i], 
            p = b.position, 
            d = b.ray.direction;
        
        //console.log("b.position.z: " + b.position.z);
        // remove bullet after it's too far
        if (Math.abs(b.position.x) > 1200
                    || Math.abs(b.position.y) > 1200
                    || Math.abs(b.position.z) > 1200){
            this.bullets.splice(i, 1);
            this.scene.remove(b);
            continue;
        }

		//if (!hit) {
        b.translateX(speed * d.x);
        b.translateY(speed * d.y);
        b.translateZ(speed * d.z);
		//}
	}
	this.renderer.render(this.scene, this.cam); // Repaint
}
Shooter3d.prototype.checkGirlCollide = function(_girl){
    var v1 = _girl.children[0].geometry.vertices[0].clone(),
        v2 = _girl.children[0].geometry.vertices[1].clone(),
        v3 = _girl.children[0].geometry.vertices[2].clone();
    var i, ray, where;

    var plane = new THREE.Plane();
    plane.setFromCoplanarPoints (v1, v2, v3);
    //console.log("plane %o", plane);


    // x, y, z: position of your object
    for(i = 0; i < this.bullets.length; i++){
        ray = new THREE.Ray (
                            new THREE.Vector3(this.bullets[i].position.x, 
                                                this.bullets[i].position.y,
                                                this.bullets[i].position.z),
                                                new THREE.Vector3(0, 1, 0));
        where = ray.intersectPlane (plane);
        //console.log("where: %o", where);
        //console.log("where: " + _girl.position.z + " : " + this.bullets[i].position.z);
        if((_girl.position.z > 0  
                && this.bullets[i].position.z > _girl.position.z 
                && Math.abs(Math.abs(this.bullets[i].position.z) - Math.abs(_girl.position.z)) < 20
                && Math.abs(Math.abs(this.bullets[i].position.x) - Math.abs(_girl.position.x)) < 40
                && Math.abs(Math.abs(this.bullets[i].position.y) - Math.abs(_girl.position.y)) < 40
                )
                        || 
            (_girl.position.z < 0 
                && this.bullets[i].position.z < _girl.position.z
                && Math.abs(Math.abs(this.bullets[i].position.z) - Math.abs(_girl.position.z)) < 20
                && Math.abs(Math.abs(this.bullets[i].position.x) - Math.abs(_girl.position.x)) < 40
                && Math.abs(Math.abs(this.bullets[i].position.y) - Math.abs(_girl.position.y)) < 40))
        {
                console.log("HIT");
        }
        //if ( where.length > 0 && where[0].distance < directionVector.length()){
			//console.log("HIT!!!");
            //return(true);
        //}
    }
    
    
    /*object.updateMatrixWorld();
    var vector = object.geometry.vertices[i].clone();
    vector.applyMatrix4( object.matrixWorld );

    ////////
    var originPoint = _bullet.position.clone();
    console.log("originPoint: %o", originPoint);
	for(var vertexIndex = 0; vertexIndex < _bullet.geometry.vertices.length; vertexIndex++){		
		var localVertex = _bullet.geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4( _bullet.matrix );
		var directionVector = globalVertex.sub( _bullet.position );
		
		var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
		var collisionResults = ray.intersectObjects( this.girls );
		if ( collisionResults.length > 0 && 
                            collisionResults[0].distance < directionVector.length()){
			//console.log("HIT!!!");
            return(true);
        }
	}*/	
    
}
Shooter3d.prototype.addBullet = function(obj){
	if (obj === undefined) {
		obj = this.cam;
	}

	var sphere = new THREE.Mesh(this.bulletGeo, this.bulletMaterial);
	sphere.position.set(obj.position.x, obj.position.y * 0.8, obj.position.z);

	if (obj instanceof THREE.Camera) {
		var vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 1);
        vector.unproject(this.cam);
		//this.projector.unprojectVector(vector, obj);
        //var dir = vector.sub( this.camera.position ).normalize();

		sphere.ray = new THREE.Ray(
				this.cam.position,
				vector.sub(this.cam.position).normalize()
		);
	}
	else {
		var vector = this.cam.position.clone();
		sphere.ray = new THREE.Ray(
				obj.position,
				vector.subSelf(obj.position).normalize()
		);
	}
	sphere.owner = obj;
	
	this.bullets.push(sphere);
	this.scene.add(sphere);
	
	return sphere;
}
// Set up the objects in the world
Shooter3d.prototype.setupScene = function(){
	var units = this.mapW;

	// Lighting
	var directionalLight1 = new THREE.DirectionalLight( 0xF7EFBE, 0.7 );
	directionalLight1.position.set( 0.5, 1, 0.5 );
	this.scene.add( directionalLight1 );
	var directionalLight2 = new THREE.DirectionalLight( 0xF7EFBE, 0.5 );
	directionalLight2.position.set( -0.5, -1, -0.5 );
	this.scene.add( directionalLight2 );

    // set up the sphere vars
    var radius = 150,
        segments = 16,
        rings = 16;

    // create a new mesh with
    // sphere geometry - we will cover
    // the sphereMaterial next!
    var sphere = new THREE.Mesh(
            new THREE.SphereGeometry(22, segments, rings),
            this.bulletMaterial);
	
    //sphere.position.set(this.cam.position.x, this.cam.position.y -100, this.cam.position.z);
    sphere.position.set(0, 277, 1700);
    // add the sphere to the scene
    this.scene.add(sphere);

// Geometry: walls

var materials = [ 
    new THREE.MeshBasicMaterial({color:0x33AA55, transparent:true, opacity:0.8}),
    new THREE.MeshBasicMaterial({color:0x55CC00, transparent:true, opacity:0.8}), 
    new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.8}),
    new THREE.MeshBasicMaterial({color:0x000000, transparent:true, opacity:0.8}), 
    new THREE.MeshBasicMaterial({color:0x0000FF, transparent:true, opacity:0.8}), 
    new THREE.MeshBasicMaterial({color:0x5555AA, transparent:true, opacity:0.8}), 
]; 
// create a MeshFaceMaterial, allows cube to have different materials on each face 
var cubeMaterial = new THREE.MeshFaceMaterial(materials); 
//var cube = new THREE.Mesh(geometry, cubeMaterial);

	var cube = new THREE.CubeGeometry(250, 100, 250);
	/*var materials = [
	                 new THREE.MeshLambertMaterial({color: 0x00CCAA}),//,map: t.ImageUtils.loadTexture('images/wall-1.jpg')}),
	                 new THREE.MeshLambertMaterial({color: 0xC5EDA0}),//map: t.ImageUtils.loadTexture('images/wall-2.jpg')}),
	                 new THREE.MeshLambertMaterial({color: 0x0099ff})
	                 ];*/
    var wall = new THREE.Mesh(cube, cubeMaterial);
    wall.position.set(0, 0, 700);
    wall.rotation.y = 3.14159 / 2;
    this.scene.add(wall);

    
    // Start Chroma
    //this.movieMaterial = new ChromaKeyMaterial('./video/cat.mp4', 596, 336, 0xd400);
    //this.movieMaterial = new ChromaKeyMaterial('./video/santaClaus.mp4', 596, 336, 0xd400);
    this.movieMaterial = new ChromaKeyMaterial('./video/robot.mp4', 596, 336, 0xd400);
    //this.movieMaterial = new ChromaKeyMaterial('./video/collection.mp4', 596, 336, 0xd400);

	var movieGeometry = new THREE.PlaneGeometry(596, 336, 4, 4);

	this.girls = [];
	for (var i = 0; i < 7; i++)
		for (var j = 0; j < 2; j++)
			if ((i + j) % 2 == 0) {
				var movie = new THREE.Mesh(movieGeometry, this.movieMaterial);
				movie.position.set(0, 53, 0);

				var girl = new THREE.Object3D();
				girl.position.set(150 * (i *4), -50, 300 * (j - 2));
				//girl.position.set(0, 0, 600);

				girl.add(movie);
				this.scene.add(girl);
                this.girls.push(girl);
            }

	/*var cube = new THREE.CubeGeometry(100, 100, 100);
	var materials = [
	                 new THREE.MeshLambertMaterial({color: 0x00CCAA}),//,map: t.ImageUtils.loadTexture('images/wall-1.jpg')}),
	                 new THREE.MeshLambertMaterial({color: 0xC5EDA0}),//map: t.ImageUtils.loadTexture('images/wall-2.jpg')}),
	                 new THREE.MeshLambertMaterial({color: 0xFBEBCD})
	                 ];
	for (var i = 0; i < this.mapW; i++) {
		for (var j = 0, m = this.map[i].length; j < m; j++) {
			if (this.map[i][j]) {
				//var wall = new THREE.Mesh(cube, materials[this.map[i][j]-1]);
                console.log("WALL");
				var wall = new THREE.Mesh(cube, materials[1]);
				wall.position.x = (i - units/2) * this.UNITSIZE;
				wall.position.y = this.WALLHEIGHT/2;
				wall.position.z = (j - units/2) * this.UNITSIZE;
				this.scene.add(wall);
			}
		}
	}*/
}



/*Shooter3d.prototype.rotatePano = function(_evt){
    var _dir = null, _increment = 0;
    //console.log("spinPanorama: %o", _evt);
    //console.log(_evt.clientX + ":" + this.realMouse.x);
    if(_evt.clientX == this.realMouse.x){
        return;
    }
    if(_evt.clientX > this.realMouse.x){
        _dir = "right";
        increment = this.spinIncrement;
    }
    else{
        _dir = "left";
        increment = this.spinIncrement*-1;
    }

    try{
        var pov = this.main.streetView.panorama.getPov();
        pov.heading += increment;
        if(pov.heading > 360.0) {
            pov.heading -= 360.0;
        }
        if(pov.heading < 0.0) {
            pov.heading += 360.0;
        }
        this.main.streetView.panorama.setPov(pov);
    }catch(e){
        console.log("caught: %o", e);
    }
}*/


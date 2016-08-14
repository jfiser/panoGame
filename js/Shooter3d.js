function Shooter3d(_main){
    var _self = this;

    this.main = _main;
    this.BULLETMOVESPEED = 1200;
	this.PROJECTILEDAMAGE = 20;
	this.UNITSIZE = 250;
    this.WALLHEIGHT = this.UNITSIZE / 3,
	this.MOVESPEED = 100;
	this.LOOKSPEED = 0.075;

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
    //if(this.tweening){
        //this.tweenUpdate(this.theGirl, this.tweenIncrement);
    //}
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
        //this.controls.lookVertical = false; // Temporary solution; play on flat surfaces only
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
        //_self.realMouse.x = evt.clientX;
        //_self.realMouse.y = evt.clientY;
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
    this.bloodSplatMaterial.update();

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
        if (Math.abs(b.position.x) > 4000
                    || Math.abs(b.position.y) > 4000
                    || Math.abs(b.position.z) > 4000){
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
    var _self = this;
    
    for(i = 0; i < this.bullets.length; i++){
        if((_girl.position.z > 0  
                && this.bullets[i].position.z > _girl.position.z // after it passes thru
                && Math.abs(Math.abs(this.bullets[i].position.z) - Math.abs(_girl.position.z)) < 20
                && Math.abs(Math.abs(this.bullets[i].position.x) - Math.abs(_girl.position.x)) < 40
                && Math.abs(Math.abs(this.bullets[i].position.y) - Math.abs(_girl.position.y)) < 140
                )
                        || 
            (_girl.position.z < 0 
                && this.bullets[i].position.z < _girl.position.z
                && Math.abs(Math.abs(this.bullets[i].position.z) - Math.abs(_girl.position.z)) < 20
                && Math.abs(Math.abs(this.bullets[i].position.x) - Math.abs(_girl.position.x)) < 40
                && Math.abs(Math.abs(this.bullets[i].position.y) - Math.abs(_girl.position.y)) < 140))
        {
                console.log("HIT");
                //this.scene.remove(_girl);

                _girl.remove(_girl.children[0]);
                _girl.add(_girl.bloodSplatMovie);
                this.bloodSplatMaterial.playVideo();
                setTimeout(function(){ _self.scene.remove(_girl) }, 1600);
                //_girl.translateX(100);

                //var a = [1,2,3,4];
                //var b = [0,0,0,0];
                /*var a = [0];
                var b = [3];
                b.onUpdate = function() {
                    console.log(a[0]);
                    _girl.translateY(a[0]);
                };
                var tween = TweenLite.to(a, 1, b);*/
                //tween.ease = Power2.easeOut;
                ///  !!! THIS TWEEN WORKS
                /*if(!this.tweening){
			        console.log("tweening!");
                    this.tweening = true;
                    var a = {0:0};
                    var b = {ease:Expo.easeOut, 0:3, onUpdate:function(){
                                    _self.tweenUpdate(_girl, a[0]);
                                },
                                onComplete:function(){
                                    _self.tweening = false;
                                }
                            };
                    //b.onUpdate = function() {
                        //console.log(a[0]);
                        //_girl.translateY(a[0]); // works
                        //_girl.position.y += a[0]; // works
                    //};
                    TweenLite.to(a, 2, b);
                }*/

                //TweenLite.to(graph, 2.5, { ease: Expo.easeOut, y: 0 });

                //yourMeshObject.material.transparent = true;
                //TweenLite.to(_girl.children[0].material, 1, {opacity: 0});
        }
        //if ( where.length > 0 && where[0].distance < directionVector.length()){
			//console.log("HIT!!!");
            //return(true);
        //}
    }
}
Shooter3d.prototype.tweenUpdate = function(_girl, _val){
    //console.log(_val);
    //_girl.translateY(a[0]); // works
    _girl.position.y += _val; // works
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
    
    // Start Chroma
    //this.movieMaterial = new ChromaKeyMaterial('./video/cat.mp4', 596, 336, 0xd400);
    this.movieMaterial = new ChromaKeyMaterial('./video/santaClaus.mp4', 596, 336, 0xd400, true);
    //this.movieMaterial = new ChromaKeyMaterial('./video/robot.mp4', 596, 336, 0xd400);
    //this.movieMaterial = new ChromaKeyMaterial('./video/chickDancing.mp4', 596, 336, 0xd400);
    //this.movieMaterial = new ChromaKeyMaterial('./video/bloodSplat2.mp4', 596, 336, 0xd400);

    this.bloodSplatMaterial = new ChromaKeyMaterial('./video/bloodExplode.mp4', 596, 336, 0xd400, false);

	var movieGeometry = new THREE.PlaneGeometry(596, 336, 4, 4);

	this.girls = [];
	for (var i = 0; i < 7; i++)
		for (var j = 0; j < 2; j++)
			if ((i + j) % 2 == 0) {
				var girl = new THREE.Object3D();
				var movie = new THREE.Mesh(movieGeometry, this.movieMaterial);
				girl.bloodSplatMovie = new THREE.Mesh(movieGeometry, this.bloodSplatMaterial);
				movie.position.set(0, 53, 0);
				girl.bloodSplatMovie.position.set(-20, 0, 0);

				//var girl = new THREE.Object3D();
				girl.position.set(150 * (i *4), -50, 300 * (j - 2));

				girl.add(movie);
                //girl.add(girl.bloodSplatMovie);
                console.log("girl.bloodSplatMovie: %o", girl.bloodSplatMovie);

				this.scene.add(girl);
                this.girls.push(girl);
            }

}



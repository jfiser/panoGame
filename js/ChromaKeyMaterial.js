function ChromaKeyMaterial(url, width, height, keyColor, autoPlay) {
	THREE.ShaderMaterial.call(this);

	this.video = document.createElement('video');
	this.video.src = url;
	if(autoPlay){
		this.video.loop = true;
		this.video.load();
		this.video.play();
	}

	var videoImage = document.createElement('canvas');
    $(videoImage).css("display", "none"); // hide the real player

	if (window["URL"]) document.body.appendChild(videoImage);
	videoImage.width = width;
	videoImage.height = height;
	
	var keyColorObject = new THREE.Color(keyColor);

	var videoImageContext = videoImage.getContext('2d');
	// background color if no video present
	videoImageContext.fillStyle = '#' + keyColorObject.getHexString();
	videoImageContext.fillRect(0, 0, videoImage.width, videoImage.height);

	var videoTexture = new THREE.Texture(videoImage);
	videoTexture.minFilter = THREE.LinearFilter;
	videoTexture.magFilter = THREE.LinearFilter;

	this.update = function () {
		if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
			videoImageContext.drawImage(this.video, 0, 0);
			if (videoTexture) {
				videoTexture.needsUpdate = true;
			}
		}
	}

	this.setValues({

		uniforms: {
			texture: {
				type: "t",
				value: videoTexture
			},
			color: {
				type: "c",
				value: keyColorObject
			}
		},
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: document.getElementById('fragmentShader').textContent,

		transparent: true
	});
}

ChromaKeyMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);

ChromaKeyMaterial.prototype.playVideo = function(){
    console.log("PlayVideo");
    this.video.load();
    this.video.play();
}


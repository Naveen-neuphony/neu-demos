"use client"
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { VRButton, XR } from '@react-three/xr';
import * as THREE from 'three';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

const VideoSphere = ({ videoSrc }: any) => {
	const videoRef = useRef(null);
	const currentScore = useRef(0);
	const [videoTexture, setVideoTexture] = useState(null);

	useEffect(() => {
		if (!videoSrc) return;

		const video = document.createElement('video');
		video.src = videoSrc;
		video.crossOrigin = 'Anonymous';
		video.loop = true;
		video.muted = true;
		video.setAttribute('webkit-playsinline', 'webkit-playsinline');
		video.setAttribute('playsinline', 'playsinline');
		video.play();

		const texture = new THREE.VideoTexture(video);
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;

		setVideoTexture(texture);

		videoRef.current = video;
		socket.on('connect', () => {
			console.log('Connected to Socket.IO server');
		});

		socket.on('message', (data) => {
			currentScore.current = data;
			// Map currentScore (0-100) to targetVelocity (0.00004 to 0.0002)
			if (videoRef.current) {
				console.log('score from electron server updated:', data);
				videoRef.current.playbackRate = data;
			}
		});

		socket.on('disconnect', () => {
			console.log('Disconnected from Socket.IO server');
		});
		return () => {
			video.pause();
			video.removeAttribute('src');
			video.load();
			socket.off('connect');
			socket.off('message');
			socket.off('disconnect');
		};
	}, [videoSrc]);



	useFrame(() => {
		if (videoTexture) {
			videoTexture.needsUpdate = true;
		}
	});

	return (
		<mesh >
			<sphereBufferGeometry args={[5, 60, 40]} />
			{videoTexture && <meshBasicMaterial map={videoTexture} side={THREE.DoubleSide} />}
		</mesh>
	);
};

const VR = () => {
	const [isVRSupported, setIsVRSupported] = useState(false);

	useEffect(() => {
		const checkWebXRSupport = async () => {
			if (navigator.xr) {
				try {
					const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
					setIsVRSupported(isSupported);
				} catch (e) {
					console.error('Error checking WebXR support:', e);
				}
			}
		};

		checkWebXRSupport();
	}, []);



	return (
		<div >
			{isVRSupported && <VRButton />}

			<Canvas>
				<XR>
					<ambientLight intensity={0.5} />
					<pointLight position={[10, 10, 10]} />
					<VideoSphere videoSrc="/glb/roller.mp4" />
					<OrbitControls />
				</XR>
			</Canvas>
		</div>
	);
};

export default VR;

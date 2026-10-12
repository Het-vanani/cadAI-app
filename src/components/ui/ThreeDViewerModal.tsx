import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import {
  X, Box, Download, RotateCcw, Plus, Trash2, Move,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Compass,
  Ruler, Scale, Maximize2, Minimize2
} from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { CADShape } from '../../types';

export const ThreeDViewerModal: React.FC = () => {
  const show = useCanvasStore((s) => s.show3DModal);
  const setShow = useCanvasStore((s) => s.setShow3DModal);
  const layers = useCanvasStore((s) => s.layers);
  const projectName = useCanvasStore((s) => s.projectName);
  const activeLayerId = useCanvasStore((s) => s.activeLayerId);
  const addShape = useCanvasStore((s) => s.addShape);
  const updateShape = useCanvasStore((s) => s.updateShape);
  const updateShapeRaw = useCanvasStore((s) => s.updateShapeRaw);
  const deleteShape = useCanvasStore((s) => s.deleteShape);

  const mountRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const [wallHeight, setWallHeight] = useState<number>(80);
  const [wallThickness, setWallThickness] = useState<number>(8);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [showEdges, setShowEdges] = useState<boolean>(true);
  const [meshCount, setMeshCount] = useState<number>(0);
  const [selected3DId, setSelected3DId] = useState<string | null>(null);
  const [gizmoEnabled, setGizmoEnabled] = useState<boolean>(true);
  const [gizmoMode, setGizmoMode] = useState<'scale' | 'translate'>('scale');
  const [draggingDimensions, setDraggingDimensions] = useState<{ width: number; length: number; height: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const meshesGroupRef = useRef<THREE.Group | null>(null);
  const centerRef = useRef<{ x: number; y: number } | null>(null);
  const isTransformDraggingRef = useRef<boolean>(false);
  const gizmoModeRef = useRef<'scale' | 'translate'>('scale');
  gizmoModeRef.current = gizmoMode;

  // Toggle fullscreen (both CSS full-viewport and optional native browser fullscreen)
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next) {
        if (!document.fullscreenElement && modalContainerRef.current?.requestFullscreen) {
          modalContainerRef.current.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Sync gizmoMode to TransformControls
  useEffect(() => {
    if (transformControlsRef.current) {
      transformControlsRef.current.setMode(gizmoMode);
    }
  }, [gizmoMode]);

  // Reset center when modal closes
  useEffect(() => {
    if (!show) {
      centerRef.current = null;
      setSelected3DId(null);
      setDraggingDimensions(null);
      setIsFullscreen(false);
    }
  }, [show]);

  // Keyboard shortcuts: Esc, S (Scale/Dimensions), M/G (Move), F (Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!show) return;
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');

      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        } else if (selected3DId) {
          setSelected3DId(null);
        } else {
          setShow(false);
        }
      } else if (!isInput) {
        if (e.key === 's' || e.key === 'S') {
          setGizmoMode('scale');
        } else if (e.key === 'g' || e.key === 'G' || e.key === 'm' || e.key === 'M') {
          setGizmoMode('translate');
        } else if (e.key === 'f' || e.key === 'F') {
          toggleFullscreen();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, setShow, selected3DId, isFullscreen]);

  // Setup Three.js scene
  useEffect(() => {
    if (!show || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#141416');
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000);
    camera.position.set(400, 350, 500);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controlsRef.current = controls;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight1.position.set(300, 550, 400);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa1a1aa, 0.5);
    dirLight2.position.set(-300, 250, -300);
    scene.add(dirLight2);

    // 6. Grid floor
    const gridHelper = new THREE.GridHelper(1800, 45, 0x71717a, 0x27272a);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    // 7. Group for CAD 3D meshes
    const meshesGroup = new THREE.Group();
    scene.add(meshesGroup);
    meshesGroupRef.current = meshesGroup;

    // 8. TransformControls (3D Dimension / Move Gizmo)
    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.size = 0.85;
    transformControls.space = 'world';
    transformControls.setMode(gizmoModeRef.current);
    scene.add(transformControls.getHelper());
    transformControlsRef.current = transformControls;

    transformControls.addEventListener('dragging-changed', (e: any) => {
      if (controlsRef.current) {
        controlsRef.current.enabled = !e.value;
      }
      isTransformDraggingRef.current = e.value;

      const mesh = transformControls.object;
      if (!mesh || !mesh.userData || !mesh.userData.shapeId) return;

      if (e.value === true) {
        // Drag start: save undo history & snapshot current shape state
        useCanvasStore.getState()._saveHistory();
        const latestShape = useCanvasStore
          .getState()
          .layers.flatMap((l: any) => l.shapes)
          .find((s: any) => s.id === mesh.userData.shapeId);
        if (latestShape) {
          mesh.userData.initShape = {
            id: latestShape.id,
            type: latestShape.type,
            x: latestShape.x ?? 0,
            y: latestShape.y ?? 0,
            width: latestShape.width ?? 0,
            height: latestShape.height ?? 0,
            height3d: latestShape.height3d != null ? latestShape.height3d : wallHeight,
            radius: latestShape.radius ?? ((latestShape.width ?? 20) / 2),
            elevation3d: latestShape.elevation3d ?? 0,
            points: latestShape.points ? JSON.parse(JSON.stringify(latestShape.points)) : [],
          };
        }
        mesh.userData.initMeshPos = { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z };
      } else {
        // Drag finished
        setDraggingDimensions(null);
        const currentMode = transformControls.getMode();
        if (currentMode === 'scale') {
          const scaleX = Math.max(0.05, Math.abs(mesh.scale.x));
          const scaleY = Math.max(0.05, Math.abs(mesh.scale.y));
          const scaleZ = Math.max(0.05, Math.abs(mesh.scale.z));
          const init = mesh.userData.initShape;

          const updates: any = {};
          const newExtrusion = Math.max(5, Math.round(init.height3d * scaleY));

          if (init.type === 'rectangle' || init.type === 'ellipse') {
            const newW = Math.max(5, Math.round(init.width * scaleX));
            const newL = Math.max(5, Math.round(init.height * scaleZ));
            updates.width = newW;
            updates.height = newL;
            updates.height3d = newExtrusion;
            const centerX = init.x + init.width / 2;
            const centerY = init.y + init.height / 2;
            updates.x = Math.round(centerX - newW / 2);
            updates.y = Math.round(centerY - newL / 2);
          } else if (init.type === 'circle') {
            const planarScale = (scaleX + scaleZ) / 2;
            const newR = Math.max(5, Math.round(init.radius * planarScale));
            updates.radius = newR;
            updates.width = newR * 2;
            updates.height = newR * 2;
            updates.height3d = newExtrusion;
            const centerX = init.x + init.width / 2;
            const centerY = init.y + init.height / 2;
            updates.x = Math.round(centerX - newR);
            updates.y = Math.round(centerY - newR);
          } else if (init.type === 'line' && init.points && init.points.length >= 2) {
            const p0 = init.points[0];
            const p1 = init.points[1];
            const midX = (p0.x + p1.x) / 2;
            const midY = (p0.y + p1.y) / 2;
            const lineScale = (scaleX + scaleZ) / 2;
            updates.points = [
              { x: Math.round(midX + (p0.x - midX) * lineScale), y: Math.round(midY + (p0.y - midY) * lineScale) },
              { x: Math.round(midX + (p1.x - midX) * lineScale), y: Math.round(midY + (p1.y - midY) * lineScale) },
            ];
            updates.height3d = newExtrusion;
          }

          // Reset mesh scale so geometry rebuild receives fresh scale (1,1,1)
          mesh.scale.set(1, 1, 1);
          if (mesh.userData.edgesLine) {
            mesh.userData.edgesLine.scale.set(1, 1, 1);
          }

          useCanvasStore.getState().updateShape(mesh.userData.shapeId, updates);
        } else {
          // Drag finished in translate mode
          const deltaX = mesh.position.x - mesh.userData.initMeshPos.x;
          const deltaZ = mesh.position.z - mesh.userData.initMeshPos.z;
          const deltaY = mesh.position.y - mesh.userData.initMeshPos.y;
          const init = mesh.userData.initShape;

          const updates: any = {};
          if (init.points && init.points.length > 0) {
            updates.points = init.points.map((p: any) => ({
              x: Math.round(p.x + deltaX),
              y: Math.round(p.y + deltaZ),
            }));
            if (init.x != null) updates.x = Math.round(init.x + deltaX);
            if (init.y != null) updates.y = Math.round(init.y + deltaZ);
          } else {
            updates.x = Math.round(init.x + deltaX);
            updates.y = Math.round(init.y + deltaZ);
          }
          updates.elevation3d = Math.max(0, Math.round(init.elevation3d + deltaY));
          useCanvasStore.getState().updateShape(mesh.userData.shapeId, updates);
        }
      }
    });

    transformControls.addEventListener('objectChange', () => {
      const mesh = transformControls.object;
      if (!mesh || !mesh.userData || !mesh.userData.shapeId) return;

      const currentMode = transformControls.getMode();
      if (currentMode === 'scale') {
        const scaleX = Math.max(0.05, Math.abs(mesh.scale.x));
        const scaleY = Math.max(0.05, Math.abs(mesh.scale.y));
        const scaleZ = Math.max(0.05, Math.abs(mesh.scale.z));
        const init = mesh.userData.initShape;

        // Keep outline edge scale in sync
        if (mesh.userData.edgesLine) {
          mesh.userData.edgesLine.scale.set(scaleX, scaleY, scaleZ);
        }

        // Anchor bottom of the mesh at its base elevation
        const initialBottomY = mesh.userData.initMeshPos.y - init.height3d / 2;
        const newExtrusion = Math.max(5, Math.round(init.height3d * scaleY));
        mesh.position.y = initialBottomY + newExtrusion / 2;
        if (mesh.userData.edgesLine) {
          mesh.userData.edgesLine.position.y = mesh.position.y;
        }

        const updates: any = {};
        if (init.type === 'rectangle' || init.type === 'ellipse') {
          const newW = Math.max(5, Math.round(init.width * scaleX));
          const newL = Math.max(5, Math.round(init.height * scaleZ));
          updates.width = newW;
          updates.height = newL;
          updates.height3d = newExtrusion;
          const centerX = init.x + init.width / 2;
          const centerY = init.y + init.height / 2;
          updates.x = Math.round(centerX - newW / 2);
          updates.y = Math.round(centerY - newL / 2);

          setDraggingDimensions({
            width: newW,
            length: newL,
            height: newExtrusion,
          });
        } else if (init.type === 'circle') {
          const planarScale = (scaleX + scaleZ) / 2;
          const newR = Math.max(5, Math.round(init.radius * planarScale));
          updates.radius = newR;
          updates.width = newR * 2;
          updates.height = newR * 2;
          updates.height3d = newExtrusion;
          const centerX = init.x + init.width / 2;
          const centerY = init.y + init.height / 2;
          updates.x = Math.round(centerX - newR);
          updates.y = Math.round(centerY - newR);

          setDraggingDimensions({
            width: newR * 2,
            length: newR * 2,
            height: newExtrusion,
          });
        } else if (init.type === 'line' && init.points && init.points.length >= 2) {
          const p0 = init.points[0];
          const p1 = init.points[1];
          const midX = (p0.x + p1.x) / 2;
          const midY = (p0.y + p1.y) / 2;
          const lineScale = (scaleX + scaleZ) / 2;
          updates.points = [
            { x: Math.round(midX + (p0.x - midX) * lineScale), y: Math.round(midY + (p0.y - midY) * lineScale) },
            { x: Math.round(midX + (p1.x - midX) * lineScale), y: Math.round(midY + (p1.y - midY) * lineScale) },
          ];
          updates.height3d = newExtrusion;

          const curLen = Math.round(Math.hypot(updates.points[1].x - updates.points[0].x, updates.points[1].y - updates.points[0].y));
          setDraggingDimensions({
            width: wallThickness,
            length: curLen,
            height: newExtrusion,
          });
        }

        useCanvasStore.getState().updateShapeRaw(mesh.userData.shapeId, updates);
      } else {
        // Translation mode
        if (mesh.userData.edgesLine) {
          mesh.userData.edgesLine.position.copy(mesh.position);
        }

        const deltaX = mesh.position.x - mesh.userData.initMeshPos.x;
        const deltaZ = mesh.position.z - mesh.userData.initMeshPos.z;
        const deltaY = mesh.position.y - mesh.userData.initMeshPos.y;
        const init = mesh.userData.initShape;

        const updates: any = {};
        if (init.points && init.points.length > 0) {
          updates.points = init.points.map((p: any) => ({
            x: Math.round(p.x + deltaX),
            y: Math.round(p.y + deltaZ),
          }));
          if (init.x != null) updates.x = Math.round(init.x + deltaX);
          if (init.y != null) updates.y = Math.round(init.y + deltaZ);
        } else {
          updates.x = Math.round(init.x + deltaX);
          updates.y = Math.round(init.y + deltaZ);
        }
        updates.elevation3d = Math.max(0, Math.round(init.elevation3d + deltaY));
        useCanvasStore.getState().updateShapeRaw(mesh.userData.shapeId, updates);
      }
    });

    // 9. Raycaster for clicking & selecting shapes in 3D
    const raycaster = new THREE.Raycaster();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (transformControls.dragging) return;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return; // ignore drags / orbit rotation

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);
      if (meshesGroupRef.current) {
        const hits = raycaster.intersectObjects(meshesGroupRef.current.children, true);
        const hit = hits.find((h) => h.object.userData && h.object.userData.shapeId);
        if (hit && hit.object.userData.shapeId) {
          setSelected3DId(hit.object.userData.shapeId);
          useCanvasStore.getState().selectShape(hit.object.userData.shapeId);
        } else {
          setSelected3DId(null);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      transformControls.dispose();
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [show]);

  // Re-extrude 3D meshes whenever shapes change
  useEffect(() => {
    if (!meshesGroupRef.current || !show) return;
    if (isTransformDraggingRef.current) return; // Do not rebuild while user is dragging gizmo

    const group = meshesGroupRef.current;
    // Clear previous meshes
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if ((obj as any).geometry) (obj as any).geometry.dispose();
    }

    const visibleLayers = layers.filter((l: any) => l.isVisible);
    const allShapes = visibleLayers.flatMap((l: any) => l.shapes);

    if (allShapes.length === 0) {
      setMeshCount(0);
      if (transformControlsRef.current) transformControlsRef.current.detach();
      return;
    }

    // Anchor center once per modal session to prevent whole scene from jumping when 1 shape moves
    if (!centerRef.current) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      allShapes.forEach((shape: any) => {
        const x = shape.x ?? 0, y = shape.y ?? 0;
        const w = shape.width ?? 0, h = shape.height ?? 0;
        const r = shape.radius ?? 0;
        if (shape.type === 'circle') {
          minX = Math.min(minX, x - r); maxX = Math.max(maxX, x + r);
          minY = Math.min(minY, y - r); maxY = Math.max(maxY, y + r);
        } else if (shape.points && shape.points.length > 0) {
          shape.points.forEach((p: any) => {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
          });
        } else {
          minX = Math.min(minX, x); maxX = Math.max(maxX, x + w);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y + h);
        }
      });
      if (isFinite(minX) && isFinite(maxX)) {
        centerRef.current = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
      } else {
        centerRef.current = { x: 0, y: 0 };
      }
    }

    const centerX = centerRef.current.x;
    const centerY = centerRef.current.y;

    let totalCreated = 0;
    let targetSelectedMesh: THREE.Mesh | null = null;

    allShapes.forEach((shape: any) => {
      const isSelectedIn3D = selected3DId === shape.id;
      const h = shape.height3d != null ? shape.height3d : wallHeight;
      const elev = shape.elevation3d != null ? shape.elevation3d : 0;
      const posY = elev + h / 2;
      const matType = shape.material3d || 'default';

      let material: THREE.Material;
      let edgeColor = 0xffffff;
      let edgeOpacity = 0.4;

      if (isSelectedIn3D) {
        material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#d4d4d8'),
          roughness: 0.25,
          metalness: 0.2,
          wireframe,
          side: THREE.DoubleSide,
          emissive: new THREE.Color(0x3f3f46),
          emissiveIntensity: 0.45,
        });
        edgeColor = 0xffffff;
        edgeOpacity = 0.95;
      } else if (matType === 'glass') {
        material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(shape.stroke && shape.stroke !== '#4f8ef7' ? shape.stroke : '#94a3b8'),
          transparent: true,
          opacity: 0.38,
          roughness: 0.1,
          metalness: 0.1,
          transmission: 0.75,
          ior: 1.52,
          wireframe,
          side: THREE.DoubleSide,
        });
        edgeColor = 0xe2e8f0;
        edgeOpacity = 0.6;
      } else if (matType === 'concrete') {
        material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(shape.stroke && shape.stroke !== '#4f8ef7' ? shape.stroke : '#e2e8f0'),
          roughness: 0.85,
          metalness: 0.05,
          wireframe,
          side: THREE.DoubleSide,
        });
        edgeColor = 0x94a3b8;
        edgeOpacity = 0.5;
      } else if (matType === 'wood') {
        material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(shape.stroke && shape.stroke !== '#4f8ef7' ? shape.stroke : '#d97706'),
          roughness: 0.55,
          metalness: 0.02,
          wireframe,
          side: THREE.DoubleSide,
        });
        edgeColor = 0xb45309;
        edgeOpacity = 0.5;
      } else if (matType === 'metal') {
        material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(shape.stroke && shape.stroke !== '#4f8ef7' ? shape.stroke : '#94a3b8'),
          roughness: 0.25,
          metalness: 0.85,
          wireframe,
          side: THREE.DoubleSide,
        });
        edgeColor = 0xe2e8f0;
        edgeOpacity = 0.6;
      } else if (matType === 'brick') {
        material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(shape.stroke && shape.stroke !== '#4f8ef7' ? shape.stroke : '#b91c1c'),
          roughness: 0.9,
          metalness: 0.0,
          wireframe,
          side: THREE.DoubleSide,
        });
        edgeColor = 0xef4444;
        edgeOpacity = 0.5;
      } else {
        // default / CAD Gray
        const colorHex = (shape.stroke && shape.stroke !== '#4f8ef7') ? shape.stroke : '#d4d4d8';
        material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(colorHex),
          roughness: 0.4,
          metalness: 0.15,
          wireframe,
          side: THREE.DoubleSide,
        });
        edgeColor = 0xa1a1aa;
        edgeOpacity = 0.5;
      }

      const edgeMaterial = new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: isSelectedIn3D ? 0.95 : edgeOpacity,
      });

      const addMeshWithEdges = (geom: THREE.BufferGeometry, posX: number, posY: number, posZ: number, rotY = 0) => {
        const mesh = new THREE.Mesh(geom, material);
        mesh.position.set(posX, posY, posZ);
        if (rotY) mesh.rotation.y = rotY;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        let edgeLineObj: THREE.LineSegments | null = null;
        if (showEdges && !wireframe) {
          const edges = new THREE.EdgesGeometry(geom);
          const line = new THREE.LineSegments(edges, edgeMaterial);
          line.position.copy(mesh.position);
          line.rotation.copy(mesh.rotation);
          line.userData = { shapeId: shape.id, shapeType: shape.type };
          group.add(line);
          edgeLineObj = line;
        }

        mesh.userData = {
          shapeId: shape.id,
          shapeType: shape.type,
          edgesLine: edgeLineObj,
          initMeshPos: { x: posX, y: posY, z: posZ },
          initShape: {
            id: shape.id,
            type: shape.type,
            x: shape.x ?? 0,
            y: shape.y ?? 0,
            width: shape.width ?? 0,
            height: shape.height ?? 0,
            height3d: h,
            radius: shape.radius ?? ((shape.width ?? 20) / 2),
            elevation3d: elev,
            points: shape.points ? JSON.parse(JSON.stringify(shape.points)) : [],
          },
        };
        group.add(mesh);

        if (isSelectedIn3D) {
          targetSelectedMesh = mesh;
        }
        totalCreated++;
      };

      switch (shape.type) {
        case 'rectangle': {
          const w = Math.max(shape.width ?? 0, 2);
          const d = Math.max(shape.height ?? 0, 2);
          const x = (shape.x ?? 0) + w / 2 - centerX;
          const z = (shape.y ?? 0) + d / 2 - centerY;
          const geom = new THREE.BoxGeometry(w, h, d);
          addMeshWithEdges(geom, x, posY, z);
          break;
        }
        case 'circle': {
          const r = Math.max(shape.radius ?? ((shape.width ?? 20) / 2), 2);
          const x = (shape.x ?? 0) + (shape.width ?? 0) / 2 - centerX;
          const z = (shape.y ?? 0) + (shape.height ?? 0) / 2 - centerY;
          const geom = new THREE.CylinderGeometry(r, r, h, 32);
          addMeshWithEdges(geom, x, posY, z);
          break;
        }
        case 'ellipse': {
          const rx = Math.max((shape.width ?? 20) / 2, 2);
          const ry = Math.max((shape.height ?? 20) / 2, 2);
          const x = (shape.x ?? 0) + rx - centerX;
          const z = (shape.y ?? 0) + ry - centerY;
          const geom = new THREE.CylinderGeometry(rx, rx, h, 32);
          geom.scale(1, 1, ry / rx);
          addMeshWithEdges(geom, x, posY, z);
          break;
        }
        case 'line': {
          const p0 = shape.points?.[0], p1 = shape.points?.[1];
          if (!p0 || !p1) break;
          const dx = p1.x - p0.x;
          const dz = p1.y - p0.y;
          const len = Math.sqrt(dx * dx + dz * dz);
          if (len < 1) break;

          const midX = (p0.x + p1.x) / 2 - centerX;
          const midZ = (p0.y + p1.y) / 2 - centerY;
          const angle = Math.atan2(dx, dz);

          const geom = new THREE.BoxGeometry(wallThickness, h, len);
          addMeshWithEdges(geom, midX, posY, midZ, angle);
          break;
        }
        case 'polyline': {
          const pts = shape.points ?? [];
          for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i], p1 = pts[i + 1];
            const dx = p1.x - p0.x;
            const dz = p1.y - p0.y;
            const len = Math.sqrt(dx * dx + dz * dz);
            if (len < 1) continue;

            const midX = (p0.x + p1.x) / 2 - centerX;
            const midZ = (p0.y + p1.y) / 2 - centerY;
            const angle = Math.atan2(dx, dz);

            const geom = new THREE.BoxGeometry(wallThickness, h, len);
            addMeshWithEdges(geom, midX, posY, midZ, angle);
          }
          break;
        }
      }
    });

    // Attach / Detach 3D Gizmo
    if (transformControlsRef.current) {
      if (targetSelectedMesh && gizmoEnabled) {
        transformControlsRef.current.setMode(gizmoMode);
        transformControlsRef.current.attach(targetSelectedMesh);
      } else {
        transformControlsRef.current.detach();
      }
    }

    setMeshCount(totalCreated);
  }, [show, layers, wallHeight, wallThickness, wireframe, showEdges, selected3DId, gizmoEnabled, gizmoMode]);

  // Quick Move / Nudge function
  const moveShapeBy = (dx: number, dy: number, dElev: number = 0) => {
    if (!selected3DId) return;
    const allShapes = layers.flatMap((l: any) => l.shapes);
    const shape = allShapes.find((s: any) => s.id === selected3DId);
    if (!shape) return;

    const updates: any = {};
    if (shape.x != null) updates.x = Math.round(shape.x + dx);
    if (shape.y != null) updates.y = Math.round(shape.y + dy);
    if (shape.points && shape.points.length > 0) {
      updates.points = shape.points.map((p: any) => ({
        x: Math.round(p.x + dx),
        y: Math.round(p.y + dy),
      }));
    }
    if (dElev !== 0) {
      updates.elevation3d = Math.max(0, Math.round((shape.elevation3d ?? 0) + dElev));
    }
    updateShape(shape.id, updates);
  };

  // Quick resize dimensions (Width, Length/Height, Extrusion Height)
  const resizeShapeBy = (dw: number, dl: number, dh = 0) => {
    if (!selected3DId) return;
    const allShapes = layers.flatMap((l: any) => l.shapes);
    const shape = allShapes.find((s: any) => s.id === selected3DId);
    if (!shape) return;

    if (shape.type === 'rectangle' || shape.type === 'ellipse') {
      const curW = shape.width ?? 50;
      const curL = shape.height ?? 50;
      const curH = shape.height3d ?? wallHeight;
      const updates: any = {
        width: Math.max(5, Math.round(curW + dw)),
        height: Math.max(5, Math.round(curL + dl)),
      };
      if (dh !== 0) {
        updates.height3d = Math.max(5, Math.round(curH + dh));
      }
      updateShape(shape.id, updates);
    } else if (shape.type === 'circle') {
      const curR = shape.radius ?? ((shape.width ?? 50) / 2);
      const curH = shape.height3d ?? wallHeight;
      const newR = Math.max(2, Math.round(curR + dw / 2));
      const updates: any = {
        radius: newR,
        width: newR * 2,
        height: newR * 2,
      };
      if (dh !== 0) {
        updates.height3d = Math.max(5, Math.round(curH + dh));
      }
      updateShape(shape.id, updates);
    } else if (shape.type === 'line' && shape.points && shape.points.length >= 2) {
      const p0 = shape.points[0];
      const p1 = shape.points[1];
      const curLen = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      if (curLen > 0) {
        const newLen = Math.max(5, Math.round(curLen + dl));
        const ux = (p1.x - p0.x) / curLen;
        const uy = (p1.y - p0.y) / curLen;
        const newP1 = { x: Math.round(p0.x + ux * newLen), y: Math.round(p0.y + uy * newLen) };
        const updates: any = { points: [p0, newP1] };
        if (dh !== 0) {
          updates.height3d = Math.max(5, Math.round((shape.height3d ?? wallHeight) + dh));
        }
        updateShape(shape.id, updates);
      }
    }
  };

  // Proportional scale factor (e.g. 0.5x, 1.25x, 2x)
  const scaleShapeBy = (factor: number) => {
    if (!selected3DId) return;
    const allShapes = layers.flatMap((l: any) => l.shapes);
    const shape = allShapes.find((s: any) => s.id === selected3DId);
    if (!shape) return;

    if (shape.type === 'rectangle' || shape.type === 'ellipse') {
      const curW = shape.width ?? 50;
      const curL = shape.height ?? 50;
      const curH = shape.height3d ?? wallHeight;
      updateShape(shape.id, {
        width: Math.max(5, Math.round(curW * factor)),
        height: Math.max(5, Math.round(curL * factor)),
        height3d: Math.max(5, Math.round(curH * factor)),
      });
    } else if (shape.type === 'circle') {
      const curR = shape.radius ?? ((shape.width ?? 50) / 2);
      const curH = shape.height3d ?? wallHeight;
      const newR = Math.max(2, Math.round(curR * factor));
      updateShape(shape.id, {
        radius: newR,
        width: newR * 2,
        height: newR * 2,
        height3d: Math.max(5, Math.round(curH * factor)),
      });
    } else if (shape.type === 'line' && shape.points && shape.points.length >= 2) {
      const p0 = shape.points[0];
      const p1 = shape.points[1];
      const curLen = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      if (curLen > 0) {
        const newLen = Math.max(5, Math.round(curLen * factor));
        const ux = (p1.x - p0.x) / curLen;
        const uy = (p1.y - p0.y) / curLen;
        const newP1 = { x: Math.round(p0.x + ux * newLen), y: Math.round(p0.y + uy * newLen) };
        updateShape(shape.id, {
          points: [p0, newP1],
          height3d: Math.max(5, Math.round((shape.height3d ?? wallHeight) * factor)),
        });
      }
    }
  };

  // Direct Position input change
  const handlePositionChange = (axis: 'x' | 'y', val: number) => {
    if (!selected3DId) return;
    const allShapes = layers.flatMap((l: any) => l.shapes);
    const shape = allShapes.find((s: any) => s.id === selected3DId);
    if (!shape) return;

    const curr = axis === 'x' ? (shape.x ?? 0) : (shape.y ?? 0);
    const diff = val - curr;
    if (axis === 'x') {
      moveShapeBy(diff, 0);
    } else {
      moveShapeBy(0, diff);
    }
  };

  // Quick Add a 3D Block directly in 3D View
  const handleAdd3DBlock = () => {
    const newShape: CADShape = {
      id: 'shape_' + Math.random().toString(36).substring(2, 9),
      type: 'rectangle',
      layerId: activeLayerId || layers[0]?.id || 'layer-1',
      x: 300 + Math.floor(Math.random() * 60) - 30,
      y: 250 + Math.floor(Math.random() * 60) - 30,
      width: 100,
      height: 80,
      stroke: '#e4e4e7',
      strokeWidth: 2,
      fill: 'transparent',
      opacity: 1,
      rotation: 0,
      isSelected: false,
      isLocked: false,
      isVisible: true,
      points: [],
      height3d: 90,
      elevation3d: 0,
      material3d: 'concrete',
    };
    addShape(newShape);
    setSelected3DId(newShape.id);
  };

  // Camera Angle View Presets
  const setCameraView = (mode: 'iso' | 'top' | 'front' | 'side') => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const targetY = wallHeight / 2;

    if (mode === 'iso') {
      controls.target.set(0, targetY, 0);
      controls.object.position.set(400, 350, 500);
    } else if (mode === 'top') {
      controls.target.set(0, 0, 0);
      controls.object.position.set(0, 750, 0.01);
    } else if (mode === 'front') {
      controls.target.set(0, targetY, 0);
      controls.object.position.set(0, targetY, 650);
    } else if (mode === 'side') {
      controls.target.set(0, targetY, 0);
      controls.object.position.set(650, targetY, 0);
    }
    controls.update();
  };

  // Export 3D as .OBJ
  const handleExportOBJ = () => {
    if (!meshesGroupRef.current) return;
    const group = meshesGroupRef.current;

    let output = `# CAD AI 3D Model Export\n# Project: ${projectName}\n# Generated: ${new Date().toISOString()}\no CAD_Model\n`;
    let vertexOffset = 1;

    group.children.forEach((child) => {
      if ((child as any).isMesh) {
        const mesh = child as THREE.Mesh;
        const geom = mesh.geometry.clone();
        geom.applyMatrix4(mesh.matrixWorld);

        const pos = geom.getAttribute('position');
        if (!pos) return;

        for (let i = 0; i < pos.count; i++) {
          output += `v ${pos.getX(i).toFixed(4)} ${pos.getY(i).toFixed(4)} ${pos.getZ(i).toFixed(4)}\n`;
        }

        const index = geom.getIndex();
        if (index) {
          for (let i = 0; i < index.count; i += 3) {
            output += `f ${index.getX(i) + vertexOffset} ${index.getX(i + 1) + vertexOffset} ${index.getX(i + 2) + vertexOffset}\n`;
          }
        } else {
          for (let i = 0; i < pos.count; i += 3) {
            output += `f ${i + vertexOffset} ${i + 1 + vertexOffset} ${i + 2 + vertexOffset}\n`;
          }
        }
        vertexOffset += pos.count;
      }
    });

    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}_3D_Model.obj`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetCamera = () => {
    setCameraView('iso');
  };

  if (!show) return null;

  const allShapes = layers.flatMap((l: any) => l.shapes);
  const selectedShape3D = allShapes.find((s: any) => s.id === selected3DId);

  return (
    <div
      ref={modalContainerRef}
      className={`fixed inset-0 z-50 select-none ${
        isFullscreen
          ? 'p-0 bg-[#141416]'
          : 'bg-black/80 backdrop-blur-md flex items-center justify-center p-3'
      }`}
    >
      <div
        className={`bg-panel-bg flex flex-col shadow-2xl overflow-hidden ${
          isFullscreen
            ? 'w-screen h-screen rounded-none border-0'
            : 'border border-panel-border rounded-xl w-full h-full max-w-6xl max-h-[90vh]'
        }`}
      >

        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-panel-border bg-[#18181b] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 border border-panel-border flex items-center justify-center">
              <Box size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white">2D → 3D Model Extrusion</h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono font-medium border border-panel-border/60">
                  {meshCount} 3D Objects
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Extruded from {projectName} · Rotate with Left Mouse · Pan with Right Mouse · Click any object to Move or Erase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Add 3D Block */}
            <button
              onClick={handleAdd3DBlock}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition-colors shadow-sm cursor-pointer"
              title="Add a new 3D box directly into the model"
            >
              <Plus size={14} />
              <span>+ Add 3D Block</span>
            </button>

            {/* Export OBJ */}
            <button
              onClick={handleExportOBJ}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 border border-zinc-500/50 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
              title="Download standard 3D OBJ file for Blender, AutoCAD 3D, or 3D printing"
            >
              <Download size={14} />
              <span>Export .OBJ</span>
            </button>

            {/* Full Screen Toggle */}
            <button
              onClick={toggleFullscreen}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors shadow-sm cursor-pointer ${
                isFullscreen
                  ? 'bg-zinc-700 text-white border-zinc-500'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-slate-200 border-panel-border'
              }`}
              title={isFullscreen ? "Exit Full Screen (F / Esc)" : "Full Screen (F)"}
              aria-label={isFullscreen ? "Exit Full Screen" : "Full Screen"}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFullscreen ? "Exit Fullscreen" : "Full Screen"}</span>
            </button>

            <button
              onClick={() => setShow(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-panel-hover transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 3D Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-[#141416]">
          <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

          {/* Interactive Mode Bar & Axis Legend */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
            {/* Mode Switcher */}
            <div className="flex items-center bg-[#18181b]/95 backdrop-blur-md border border-panel-border rounded-lg p-0.5 shadow-xl">
              <button
                onClick={() => setGizmoMode('scale')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  gizmoMode === 'scale'
                    ? 'bg-zinc-700 text-white shadow-sm border border-zinc-500/70'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Resize dimensions by dragging 3D axis handles directly on the block (Hotkey: S)"
              >
                <Ruler size={13} className="text-zinc-300" />
                <span>Resize Dimensions</span>
              </button>
              <button
                onClick={() => setGizmoMode('translate')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  gizmoMode === 'translate'
                    ? 'bg-zinc-700 text-white shadow-sm border border-zinc-500/70'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Move position by dragging 3D arrows (Hotkey: M / G)"
              >
                <Move size={13} className="text-zinc-300" />
                <span>Move</span>
              </button>
            </div>

            {/* Axis Color Legend */}
            {selectedShape3D && gizmoMode === 'scale' && (
              <div className="hidden sm:flex items-center gap-2.5 bg-[#18181b]/90 backdrop-blur-md border border-panel-border rounded-lg px-2.5 py-1 text-[10px] text-slate-300 shadow-lg">
                <span className="flex items-center gap-1 font-mono"><span className="w-2 h-2 rounded-full bg-red-500 shadow-sm" /> Red: Width (X)</span>
                <span className="flex items-center gap-1 font-mono"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" /> Blue: Length (Y)</span>
                <span className="flex items-center gap-1 font-mono"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" /> Green: Height (Z)</span>
                <span className="flex items-center gap-1 font-mono"><span className="w-2 h-2 rounded-full bg-zinc-300 shadow-sm" /> Center: All</span>
              </div>
            )}
            {selectedShape3D && gizmoMode === 'translate' && (
              <div className="hidden sm:flex items-center gap-2.5 bg-[#18181b]/90 backdrop-blur-md border border-panel-border rounded-lg px-2.5 py-1 text-[10px] text-slate-300 shadow-lg">
                <span className="flex items-center gap-1 font-mono"><span className="w-2 h-2 rounded-full bg-red-500 shadow-sm" /> Red: Move X</span>
                <span className="flex items-center gap-1 font-mono"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm" /> Blue: Move Y</span>
                <span className="flex items-center gap-1 font-mono"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" /> Green: Move Z (Elev)</span>
              </div>
            )}
          </div>

          {/* Live Dragging Dimensions HUD */}
          {draggingDimensions && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#18181b]/95 border border-zinc-500 rounded-full px-4 py-1.5 shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs font-mono text-white animate-pulse pointer-events-none">
              <span className="text-zinc-400 font-sans text-[11px] font-semibold flex items-center gap-1">
                <Ruler size={13} className="text-zinc-300" />
                <span>Live Dimensions:</span>
              </span>
              <span className="text-red-400 font-bold">{draggingDimensions.width} mm (W)</span>
              <span className="text-slate-500">×</span>
              <span className="text-blue-400 font-bold">{draggingDimensions.length} mm (L)</span>
              <span className="text-slate-500">×</span>
              <span className="text-emerald-400 font-bold">{draggingDimensions.height} mm (H)</span>
            </div>
          )}

          {/* Floating 3D Object Inspector (when an object is clicked in 3D) */}
          {selectedShape3D && (() => {
            const shapeWidth = Math.round(selectedShape3D.width ?? 0);
            const shapeLength = Math.round(selectedShape3D.height ?? 0);
            const shapeHeight = Math.round(selectedShape3D.height3d ?? wallHeight);
            const shapeElevation = Math.round(selectedShape3D.elevation3d ?? 0);
            const shapeRadius = Math.round(selectedShape3D.radius ?? (shapeWidth / 2 || 20));
            const shapeDiameter = shapeRadius * 2;
            const lineLen = (selectedShape3D.type === 'line' && selectedShape3D.points?.length >= 2)
              ? Math.round(Math.hypot(selectedShape3D.points[1].x - selectedShape3D.points[0].x, selectedShape3D.points[1].y - selectedShape3D.points[0].y))
              : 0;

            return (
              <div className="absolute top-3 right-3 z-20 w-84 max-h-[84vh] overflow-y-auto bg-panel-bg/98 border border-zinc-600/70 rounded-xl p-3.5 shadow-2xl backdrop-blur-md">
                {/* Header with Title & Deselect */}
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-panel-border/80">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 border border-panel-border flex items-center justify-center">
                      <Box size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white capitalize">{selectedShape3D.type} Block</p>
                      <p className="text-[10px] text-slate-400 font-mono">ID: {selectedShape3D.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected3DId(null)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-panel-hover transition-colors cursor-pointer"
                    title="Deselect"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* ── 1. Adjust Dimensions (Length, Width, Height) ── */}
                <div className="bg-[#18181b] border border-panel-border/70 rounded-lg p-2.5 mb-2.5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Ruler size={13} className="text-zinc-300" />
                      <span className="text-[11px] font-semibold text-slate-200">Adjust Dimensions</span>
                    </div>
                    {/* Live Dimension Badge */}
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-panel-border text-zinc-300">
                      {selectedShape3D.type === 'rectangle' && `${shapeWidth} × ${shapeLength} × ${shapeHeight} mm`}
                      {selectedShape3D.type === 'circle' && `⌀ ${shapeDiameter} × ${shapeHeight} mm`}
                      {selectedShape3D.type === 'ellipse' && `${shapeWidth} × ${shapeLength} × ${shapeHeight} mm`}
                      {selectedShape3D.type === 'line' && `L: ${lineLen} × H: ${shapeHeight} mm`}
                      {!['rectangle', 'circle', 'ellipse', 'line'].includes(selectedShape3D.type) && `H: ${shapeHeight} mm`}
                    </span>
                  </div>

                  {/* 3D Gizmo Mode Selector within Inspector */}
                  <div className="flex items-center bg-[#27272a] p-0.5 rounded-lg border border-panel-border/80 mb-2.5">
                    <button
                      onClick={() => setGizmoMode('scale')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        gizmoMode === 'scale'
                          ? 'bg-zinc-700 text-white shadow-sm border border-zinc-500/50'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Drag 3D axis handles to adjust dimensions directly"
                    >
                      <Ruler size={11} className="text-zinc-300" />
                      <span>3D Axis Resize</span>
                    </button>
                    <button
                      onClick={() => setGizmoMode('translate')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                        gizmoMode === 'translate'
                          ? 'bg-zinc-700 text-white shadow-sm border border-zinc-500/50'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Drag 3D arrows to move the block"
                    >
                      <Move size={11} className="text-zinc-300" />
                      <span>3D Move Arrows</span>
                    </button>
                  </div>

                  {gizmoMode === 'scale' ? (
                    <div className="bg-[#202024] border border-panel-border/60 rounded-md p-1.5 mb-2.5 text-[9.5px] text-zinc-300 leading-snug">
                      <p className="font-semibold text-white mb-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                        <span>Interactive 3D Axis Handles Active:</span>
                      </p>
                      <p className="text-slate-400">
                        Drag the <strong className="text-red-400">Red</strong> box for Width, <strong className="text-blue-400">Blue</strong> box for Length, or <strong className="text-emerald-400">Green</strong> box for Height directly on the 3D block!
                      </p>
                    </div>
                  ) : (
                    <div className="bg-[#202024] border border-panel-border/60 rounded-md p-1.5 mb-2.5 text-[9.5px] text-zinc-300 leading-snug">
                      <p className="font-semibold text-white mb-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block animate-pulse" />
                        <span>Move Arrows Active:</span>
                      </p>
                      <p className="text-slate-400">
                        Drag the <strong className="text-red-400">Red (X)</strong>, <strong className="text-blue-400">Blue (Y)</strong>, or <strong className="text-emerald-400">Green (Elev)</strong> arrows to reposition in 3D.
                      </p>
                    </div>
                  )}

                  {/* Rectangle / Ellipse Controls */}
                  {(selectedShape3D.type === 'rectangle' || selectedShape3D.type === 'ellipse') && (
                    <>
                      {/* Width (X) */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-slate-300 font-medium">Width (X)</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="5"
                              max="2000"
                              value={shapeWidth}
                              onChange={(e) => updateShape(selectedShape3D.id, { width: Math.max(5, Number(e.target.value)) })}
                              className="w-16 bg-[#27272a] border border-panel-border rounded px-1.5 py-0.5 text-xs text-white font-mono text-right focus:border-zinc-400 outline-none"
                            />
                            <span className="text-[10px] text-slate-400">mm</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => resizeShapeBy(-20, 0)}
                            className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer border border-panel-border/60"
                            title="-20mm Width"
                          >
                            -20
                          </button>
                          <input
                            type="range"
                            min="10"
                            max="800"
                            step="5"
                            value={shapeWidth}
                            onChange={(e) => updateShape(selectedShape3D.id, { width: Number(e.target.value) })}
                            className="flex-1 accent-zinc-400 cursor-pointer"
                          />
                          <button
                            onClick={() => resizeShapeBy(20, 0)}
                            className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer border border-panel-border/60"
                            title="+20mm Width"
                          >
                            +20
                          </button>
                        </div>
                      </div>

                      {/* Length / Depth (Y) */}
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-slate-300 font-medium">Length / Depth (Y)</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="5"
                              max="2000"
                              value={shapeLength}
                              onChange={(e) => updateShape(selectedShape3D.id, { height: Math.max(5, Number(e.target.value)) })}
                              className="w-16 bg-[#27272a] border border-panel-border rounded px-1.5 py-0.5 text-xs text-white font-mono text-right focus:border-zinc-400 outline-none"
                            />
                            <span className="text-[10px] text-slate-400">mm</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => resizeShapeBy(0, -20)}
                            className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer border border-panel-border/60"
                            title="-20mm Length"
                          >
                            -20
                          </button>
                          <input
                            type="range"
                            min="10"
                            max="800"
                            step="5"
                            value={shapeLength}
                            onChange={(e) => updateShape(selectedShape3D.id, { height: Number(e.target.value) })}
                            className="flex-1 accent-zinc-400 cursor-pointer"
                          />
                          <button
                            onClick={() => resizeShapeBy(0, 20)}
                            className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer border border-panel-border/60"
                            title="+20mm Length"
                          >
                            +20
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Circle Controls (Radius & Diameter) */}
                  {selectedShape3D.type === 'circle' && (
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-300 font-medium">Diameter (Width & Length)</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400">⌀</span>
                          <input
                            type="number"
                            min="4"
                            max="1600"
                            value={shapeDiameter}
                            onChange={(e) => {
                              const d = Math.max(4, Number(e.target.value));
                              updateShape(selectedShape3D.id, { radius: d / 2, width: d, height: d });
                            }}
                            className="w-16 bg-[#27272a] border border-panel-border rounded px-1.5 py-0.5 text-xs text-white font-mono text-right focus:border-zinc-400 outline-none"
                          />
                          <span className="text-[10px] text-slate-400">mm</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => resizeShapeBy(-20, 0)}
                          className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer border border-panel-border/60"
                          title="-20mm Diameter"
                        >
                          -20
                        </button>
                        <input
                          type="range"
                          min="10"
                          max="600"
                          step="5"
                          value={shapeDiameter}
                          onChange={(e) => {
                            const d = Number(e.target.value);
                            updateShape(selectedShape3D.id, { radius: d / 2, width: d, height: d });
                          }}
                          className="flex-1 accent-zinc-400 cursor-pointer"
                        />
                        <button
                          onClick={() => resizeShapeBy(20, 0)}
                          className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer border border-panel-border/60"
                          title="+20mm Diameter"
                        >
                          +20
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Line Controls (Length) */}
                  {selectedShape3D.type === 'line' && (
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-300 font-medium">Wall Length</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="10"
                            max="2000"
                            value={lineLen}
                            onChange={(e) => resizeShapeBy(0, Number(e.target.value) - lineLen)}
                            className="w-16 bg-[#27272a] border border-panel-border rounded px-1.5 py-0.5 text-xs text-white font-mono text-right focus:border-zinc-400 outline-none"
                          />
                          <span className="text-[10px] text-slate-400">mm</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => resizeShapeBy(0, -20)}
                          className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer border border-panel-border/60"
                          title="-20mm Length"
                        >
                          -20
                        </button>
                        <input
                          type="range"
                          min="20"
                          max="1000"
                          step="10"
                          value={lineLen}
                          onChange={(e) => resizeShapeBy(0, Number(e.target.value) - lineLen)}
                          className="flex-1 accent-zinc-400 cursor-pointer"
                        />
                        <button
                          onClick={() => resizeShapeBy(0, 20)}
                          className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer border border-panel-border/60"
                          title="+20mm Length"
                        >
                          +20
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Height (Z Extrusion) */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-300 font-medium">Height (Z Extrusion)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={shapeHeight}
                          onChange={(e) => updateShape(selectedShape3D.id, { height3d: Math.max(1, Number(e.target.value)) })}
                          className="w-16 bg-[#27272a] border border-panel-border rounded px-1.5 py-0.5 text-xs text-white font-mono text-right focus:border-zinc-400 outline-none"
                        />
                        <span className="text-[10px] text-slate-400">mm</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => resizeShapeBy(0, 0, -20)}
                        className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer border border-panel-border/60"
                        title="-20mm Height"
                      >
                        -20
                      </button>
                      <input
                        type="range"
                        min="5"
                        max="400"
                        step="5"
                        value={shapeHeight}
                        onChange={(e) => updateShape(selectedShape3D.id, { height3d: Number(e.target.value) })}
                        className="flex-1 accent-zinc-400 cursor-pointer"
                      />
                      <button
                        onClick={() => resizeShapeBy(0, 0, 20)}
                        className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer border border-panel-border/60"
                        title="+20mm Height"
                      >
                        +20
                      </button>
                    </div>
                  </div>

                  {/* Elevation (Base Z) */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-300 font-medium">Elevation (Base Z)</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="1000"
                          value={shapeElevation}
                          onChange={(e) => updateShape(selectedShape3D.id, { elevation3d: Math.max(0, Number(e.target.value)) })}
                          className="w-16 bg-[#27272a] border border-panel-border rounded px-1.5 py-0.5 text-xs text-white font-mono text-right focus:border-zinc-400 outline-none"
                        />
                        <span className="text-[10px] text-slate-400">mm</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      step="5"
                      value={shapeElevation}
                      onChange={(e) => updateShape(selectedShape3D.id, { elevation3d: Number(e.target.value) })}
                      className="w-full accent-zinc-400 cursor-pointer"
                    />
                  </div>

                  {/* Proportional Scaling Presets */}
                  <div className="pt-2 border-t border-panel-border/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Scale size={11} className="text-zinc-400" />
                        <span>Scale All Proportions:</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: '½ Half', factor: 0.5 },
                        { label: '-20%', factor: 0.8 },
                        { label: '+25%', factor: 1.25 },
                        { label: '2× Double', factor: 2.0 },
                      ].map((p) => (
                        <button
                          key={p.label}
                          onClick={() => scaleShapeBy(p.factor)}
                          className="py-1 px-1 rounded bg-[#27272a] hover:bg-zinc-700 text-slate-300 hover:text-white border border-panel-border/60 text-[9px] font-mono transition-colors cursor-pointer text-center"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── 2. Move & Position Controls ── */}
                <div className="bg-[#18181b] border border-panel-border/60 rounded-lg p-2.5 mb-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Move size={13} className="text-zinc-300" />
                      <span className="text-[11px] font-semibold text-slate-200">Move in 3D</span>
                    </div>
                    <button
                      onClick={() => setGizmoEnabled(!gizmoEnabled)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                        gizmoEnabled
                          ? 'bg-zinc-700 text-white border-zinc-500 shadow-sm'
                          : 'bg-panel-hover text-slate-400 border-panel-border'
                      }`}
                      title="Toggle 3D Move Arrows (Gizmo)"
                    >
                      {gizmoEnabled ? '3D Arrows: ON' : '3D Arrows: OFF'}
                    </button>
                  </div>

                  {/* 4-Way Directional Pad */}
                  <div className="flex flex-col items-center gap-1 my-1">
                    <button
                      onClick={() => moveShapeBy(0, -25)}
                      className="flex items-center gap-1 px-3 py-1 rounded bg-[#27272a] hover:bg-zinc-700 text-slate-200 hover:text-white border border-panel-border text-[10px] font-medium transition-colors cursor-pointer"
                      title="Move Forward (-Y)"
                    >
                      <ChevronUp size={12} />
                      <span>Forward</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveShapeBy(-25, 0)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#27272a] hover:bg-zinc-700 text-slate-200 hover:text-white border border-panel-border text-[10px] font-medium transition-colors cursor-pointer"
                        title="Move Left (-X)"
                      >
                        <ChevronLeft size={12} />
                        <span>Left</span>
                      </button>

                      <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 border border-panel-border/60 flex items-center justify-center text-[9px] font-mono">
                        25
                      </div>

                      <button
                        onClick={() => moveShapeBy(25, 0)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#27272a] hover:bg-zinc-700 text-slate-200 hover:text-white border border-panel-border text-[10px] font-medium transition-colors cursor-pointer"
                        title="Move Right (+X)"
                      >
                        <span>Right</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => moveShapeBy(0, 25)}
                      className="flex items-center gap-1 px-3 py-1 rounded bg-[#27272a] hover:bg-zinc-700 text-slate-200 hover:text-white border border-panel-border text-[10px] font-medium transition-colors cursor-pointer"
                      title="Move Back (+Y)"
                    >
                      <ChevronDown size={12} />
                      <span>Back</span>
                    </button>
                  </div>

                  {/* Coordinate Inputs */}
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-panel-border/40">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-400">Position X</span>
                        <span className="text-[9px] text-slate-500">mm</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveShapeBy(-20, 0)}
                          className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                          title="-20mm"
                        >
                          -20
                        </button>
                        <input
                          type="number"
                          value={Math.round(selectedShape3D.x ?? 0)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateShape(selectedShape3D.id, { x: val });
                          }}
                          className="w-full bg-[#18181b] border border-panel-border rounded px-1 py-0.5 text-xs text-white font-mono text-center"
                        />
                        <button
                          onClick={() => moveShapeBy(20, 0)}
                          className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                          title="+20mm"
                        >
                          +20
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-400">Position Y</span>
                        <span className="text-[9px] text-slate-500">mm</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveShapeBy(0, -20)}
                          className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                          title="-20mm"
                        >
                          -20
                        </button>
                        <input
                          type="number"
                          value={Math.round(selectedShape3D.y ?? 0)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateShape(selectedShape3D.id, { y: val });
                          }}
                          className="w-full bg-[#18181b] border border-panel-border rounded px-1 py-0.5 text-xs text-white font-mono text-center"
                        />
                        <button
                          onClick={() => moveShapeBy(0, 20)}
                          className="px-1.5 py-0.5 rounded bg-panel-hover hover:bg-zinc-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                          title="+20mm"
                        >
                          +20
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 3. 3D Finish / Material Selection ── */}
                <div className="bg-[#18181b] border border-panel-border/60 rounded-lg p-2.5 mb-2.5">
                  <span className="text-[11px] text-slate-200 font-semibold mb-2 block">
                    3D Finish / Material
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'concrete', label: 'Concrete', icon: '🧱' },
                      { id: 'glass',    label: 'Glass',    icon: '🪟' },
                      { id: 'wood',     label: 'Wood',     icon: '🪵' },
                      { id: 'metal',    label: 'Metal',    icon: '⚙️' },
                      { id: 'brick',    label: 'Brick',    icon: '🔴' },
                      { id: 'default',  label: 'CAD Gray', icon: '◻️' },
                    ].map((m) => {
                      const active = (selectedShape3D.material3d || 'default') === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => updateShape(selectedShape3D.id, { material3d: m.id as any })}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
                            active
                              ? 'border-zinc-400 bg-zinc-700 text-white shadow-sm ring-1 ring-zinc-400'
                              : 'border-panel-border/70 bg-[#27272a] text-slate-400 hover:text-white hover:bg-panel-hover'
                          }`}
                        >
                          <span>{m.icon}</span>
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── 4. Erase / Delete Object Button ── */}
                <button
                  onClick={() => {
                    deleteShape(selectedShape3D.id);
                    setSelected3DId(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/40 hover:border-red-500/70 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-md"
                >
                  <Trash2 size={14} />
                  <span>Erase / Delete from 3D View</span>
                </button>
              </div>
            );
          })()}

          {/* Floating Global Controls Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-panel-bg/95 border border-panel-border/80 rounded-xl px-5 py-2.5 flex items-center gap-5 shadow-2xl backdrop-blur-md">

            {/* Camera Views Preset Pills */}
            <div className="flex items-center gap-1 bg-[#141416] border border-panel-border/80 rounded-lg p-1">
              <span className="text-[10px] text-slate-400 font-medium px-1.5 flex items-center gap-1">
                <Compass size={11} className="text-zinc-300" />
                <span>View:</span>
              </span>
              <button
                onClick={() => setCameraView('iso')}
                className="px-2 py-1 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-panel-hover transition-colors cursor-pointer"
                title="Isometric 3D View"
              >
                Isometric
              </button>
              <button
                onClick={() => setCameraView('top')}
                className="px-2 py-1 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-panel-hover transition-colors cursor-pointer"
                title="Top Plan View (look straight down)"
              >
                Top Plan
              </button>
              <button
                onClick={() => setCameraView('front')}
                className="px-2 py-1 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-panel-hover transition-colors cursor-pointer"
                title="Front Elevation View"
              >
                Front
              </button>
              <button
                onClick={() => setCameraView('side')}
                className="px-2 py-1 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-panel-hover transition-colors cursor-pointer"
                title="Side Elevation View"
              >
                Side
              </button>
            </div>

            <div className="w-px h-5 bg-panel-border" />

            {/* Default Height Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Wall Height:</span>
              <input
                type="range"
                min="10"
                max="300"
                value={wallHeight}
                onChange={(e) => setWallHeight(Number(e.target.value))}
                className="w-20 accent-zinc-400 cursor-pointer"
              />
              <span className="text-xs text-zinc-300 font-mono w-7">{wallHeight}</span>
            </div>

            {/* Thickness Slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Thickness:</span>
              <input
                type="range"
                min="2"
                max="30"
                value={wallThickness}
                onChange={(e) => setWallThickness(Number(e.target.value))}
                className="w-16 accent-zinc-400 cursor-pointer"
              />
              <span className="text-xs text-zinc-300 font-mono w-5">{wallThickness}</span>
            </div>

            <div className="w-px h-5 bg-panel-border" />

            {/* Wireframe Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={wireframe}
                onChange={(e) => setWireframe(e.target.checked)}
                className="rounded bg-[#18181b] border-panel-border text-zinc-400"
              />
              <span>Wireframe</span>
            </label>

            {/* Edges Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={showEdges}
                onChange={(e) => setShowEdges(e.target.checked)}
                className="rounded bg-[#18181b] border-panel-border text-zinc-400"
              />
              <span>Outlines</span>
            </label>

            <div className="w-px h-5 bg-panel-border" />

            {/* Reset Camera */}
            <button
              onClick={handleResetCamera}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white hover:bg-panel-hover px-2 py-1 rounded transition-colors cursor-pointer"
              title="Reset 3D camera position"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

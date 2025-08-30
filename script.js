const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const cubeSize = 1;
const spacing = 1.05;
const cubelets = [];
const initialPositions = [];

const faceColors = {
  px: "red",
  nx: "orange",
  py: "white",
  ny: "yellow",
  pz: "blue",
  nz: "green"
};

for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      const materials = [
        new THREE.MeshBasicMaterial({ color: x === 1 ? faceColors.px : "black" }),
        new THREE.MeshBasicMaterial({ color: x === -1 ? faceColors.nx : "black" }),
        new THREE.MeshBasicMaterial({ color: y === 1 ? faceColors.py : "black" }),
        new THREE.MeshBasicMaterial({ color: y === -1 ? faceColors.ny : "black" }),
        new THREE.MeshBasicMaterial({ color: z === 1 ? faceColors.pz : "black" }),
        new THREE.MeshBasicMaterial({ color: z === -1 ? faceColors.nz : "black" })
      ];

      const cubelet = new THREE.Mesh(geometry, materials);
      cubelet.position.set(x * spacing, y * spacing, z * spacing);
      cubelet.userData.gridPosition = { x, y, z };
      initialPositions.push({ mesh: cubelet, position: cubelet.position.clone() });
      scene.add(cubelet);
      cubelets.push(cubelet);
    }
  }
}

let isRotating = false;

function rotateLayerAnimated(axis, value, angle, callback = () => {}) {
  if (isRotating) return;
  isRotating = true;

  const group = new THREE.Group();
  const selected = [];

  cubelets.forEach(cubelet => {
    if (Math.abs(cubelet.userData.gridPosition[axis] - value) < 0.01) {
      group.attach(cubelet);
      selected.push(cubelet);
    }
  });

  scene.add(group);
  const duration = 300;
  const start = performance.now();

  function animateRotation() {
    const now = performance.now();
    const t = Math.min((now - start) / duration, 1);
    group.rotation[axis] = angle * t;

    if (t < 1) {
      requestAnimationFrame(animateRotation);
    } else {
      group.rotation[axis] = 0;
      const rotationMatrix = new THREE.Matrix4();
      if (axis === "x") rotationMatrix.makeRotationX(angle);
      if (axis === "y") rotationMatrix.makeRotationY(angle);
      if (axis === "z") rotationMatrix.makeRotationZ(angle);

      selected.forEach(cubelet => {
        cubelet.applyMatrix4(rotationMatrix);
        scene.attach(cubelet);
        const pos = cubelet.position;
        cubelet.userData.gridPosition = {
          x: Math.round(pos.x / spacing),
          y: Math.round(pos.y / spacing),
          z: Math.round(pos.z / spacing)
        };
      });

      scene.remove(group);
      isRotating = false;
      callback();
    }
  }

  animateRotation();
}

function rotateLayerInstant(axis, value, angle) {
  const group = new THREE.Group();
  const selected = [];

  cubelets.forEach(cubelet => {
    if (Math.abs(cubelet.userData.gridPosition[axis] - value) < 0.01) {
      group.attach(cubelet);
      selected.push(cubelet);
    }
  });

  const matrix = new THREE.Matrix4();
  if (axis === "x") matrix.makeRotationX(angle);
  if (axis === "y") matrix.makeRotationY(angle);
  if (axis === "z") matrix.makeRotationZ(angle);

  selected.forEach(cubelet => {
    cubelet.applyMatrix4(matrix);
    scene.attach(cubelet);
    const pos = cubelet.position;
    cubelet.userData.gridPosition = {
      x: Math.round(pos.x / spacing),
      y: Math.round(pos.y / spacing),
      z: Math.round(pos.z / spacing)
    };
  });

  scene.remove(group);
}

function shuffleCube(moves = 20) {
  const axes = ["x", "y", "z"];
  const values = [-1, 0, 1];
  const angles = [-Math.PI / 2, Math.PI / 2];

  for (let i = 0; i < moves; i++) {
    const axis = axes[Math.floor(Math.random() * axes.length)];
    const value = values[Math.floor(Math.random() * values.length)];
    const angle = angles[Math.floor(Math.random() * angles.length)];
    rotateLayerInstant(axis, value, angle);
  }
}

function resetCube() {
  cubelets.forEach(cubelet => {
    const original = initialPositions.find(p => p.mesh === cubelet);
    if (original) {
      cubelet.position.copy(original.position);
      cubelet.rotation.set(0, 0, 0);
      cubelet.updateMatrix();
      cubelet.matrix.identity();
      cubelet.updateMatrixWorld(true);
      cubelet.userData.gridPosition = {
        x: Math.round(original.position.x / spacing),
        y: Math.round(original.position.y / spacing),
        z: Math.round(original.position.z / spacing)
      };
    }
  });
  isRotating = false;
}

document.getElementById("shuffleBtn").addEventListener("click", () => {
  shuffleCube();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  resetCube();
});

window.addEventListener("keydown", event => {
  if (isRotating) return;
  const key = event.key.toLowerCase();
  if (key === "u") rotateLayerAnimated("y", 1, -Math.PI / 2);
  if (key === "d") rotateLayerAnimated("y", -1, Math.PI / 2);
  if (key === "r") rotateLayerAnimated("x", 1, -Math.PI / 2);
  if (key === "l") rotateLayerAnimated("x", -1, Math.PI / 2);
  if (key === "f") rotateLayerAnimated("z", 1, -Math.PI / 2);
  if (key === "b") rotateLayerAnimated("z", -1, Math.PI / 2);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

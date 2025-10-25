export const controls = {
  left: false,
  right: false,
};

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyA") controls.left = true;
  if (e.code === "KeyD") controls.right = true;
});

document.addEventListener("keyup", (e) => {
  if (e.code === "KeyA") controls.left = false;
  if (e.code === "KeyD") controls.right = false;
});

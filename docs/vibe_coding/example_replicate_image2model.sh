# Example of using Replicate to generate a 3D model from an image

## Image to Model

``` typescript
import Replicate from "replicate";
const replicate = new Replicate();

const input = {
    images: ["https://replicate.delivery/pbxt/MJaYRxQMgIzPsALScNadsZFCXR2h1n97xBzhRinmUQw9aw25/ephemeros_a_dune_sandworm_with_black_background_de398ce7-2276-4634-8f1d-c4ed2423cda4.png"],
    texture_size: 2048,
    mesh_simplify: 0.9,
    generate_model: true,
    save_gaussian_ply: true,
    ss_sampling_steps: 38
};

const output = await replicate.run("firtoz/trellis:e8f6c45206993f297372f5436b90350817bd9b4a0d52d2a76df50c1c8afa2b3c", { input });
console.log(output)
//=> {"model_file":"https://replicate.delivery/yhqm/5xOmxKPXDT...
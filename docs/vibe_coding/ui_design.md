I am developing a cross-platform software(Windows/MacOS/Web) aimed for minimal 3D model generation based on react. You are an expert at web UI design now I need you to help me to design the UI proptotype based on the following feature and workflow description.

The main layout should be a 1 row x 2 column viewport where the left is the image viewport and the right is the 3D viewport. And below them we support text-based image generation and advanced generation parameters etc.

Basically the workflow is that the user drop/select an image, and then we submit it to the API endpoints and query the task until it's finished. When done we download it into the local 3D viewport. We also support text prompt as input, in that case you will call the image generation API and display the image in the same image viewport. The 3d viewport should support different view modes (wireframe, solid, rendered), place some buttons to switch them.

The advanced generation parameters include:
1. Generate Texture 
2. HD Texture 
3. Generate In Parts
4. Low Poly 
5. Quad Topology

Notice that each basic generation will have a credit consumption, and each advanced generation parameter will lead to an extra credit consumption, display tooltip on top of each button.

There will be a button for export the model to specific local directory. 

Also place some settings button on the UI(e.g. configure the API provider/API key), and button to switch the theme (dark/light etc.).

You should first provide a single static page html to demonstrate the design and I will review that. The basic principle should be concise but elegant.
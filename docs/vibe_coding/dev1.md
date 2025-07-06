You are an expert in frontend web developmemnt, expert in typescript, rect and 3d development.

I am developing a cross-platform software(Windows/MacOS/Web) aimed for minimal 3D model generation based on react. The API documents is provided at https://platform.tripo3d.ai/docs/generation. You can use playwright mcp to check them if needed.

Basically the workflow is that the user drops/selects an image, and then we submit it to the API endpoints and keep querying the status of the task until it's finished. When the task is done we download the result into the local 3D viewport. The application also supports text as the input, in that case you will call the image generation API and display the image in the same image viewport. The 3d viewport should support different view modes (wireframe, solid, rendered), place some buttons to switch them.

The advanced generation parameters include:
1. Generate Texture 
2. HD Texture 
3. Generate In Parts
4. Low Poly 
5. Quad Topology

Notice that each basic generation will have a credit consumption, and each advanced generation parameter will lead to an extra credit consumption, display tooltip on top of each button. There is also a button for export the model to specific local directory. 

The ui layout is attached as an image, and also provided at @ui-prototype.html.

Now implement this application in this codebase, and finally package it into an application using electron. You should carefully organize the codebase so that it's scalable and can be easily extended to other API providers in the future.

Base your code on typescript and react.
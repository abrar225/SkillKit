// Only a fixed category ID crosses the loopback boundary. The proxy constructs all upstream URLs.
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const categories=['web','video','motion','design','copy'];
const server=new Server({name:'web',version:'1'},{capabilities:{tools:{}}});
server.setRequestHandler(ListToolsRequestSchema,async()=>({tools:[{name:'search_web',description:'Find current public agent skills by category on GitHub.',inputSchema:{type:'object',properties:{category:{enum:categories}},required:['category'],additionalProperties:false}}]}));
server.setRequestHandler(CallToolRequestSchema,async({params})=>{
 const category=params.arguments?.category;
 if(params.name!=='search_web'||!categories.includes(category))throw Error('Unknown category.');
 const r=await fetch('http://127.0.0.1:3898/'+category);
 return {isError:!r.ok,content:[{type:'text',text:(await r.text()).slice(0,5000)}]};
});
server.connect(new StdioServerTransport());

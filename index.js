const http = require("http");
const socketIO = require("socket.io");

const server = http.createServer();
const io = socketIO(server);

const clients = [];
let locations = [];
const visibles = [];

io.on("connection", (socket) => {
  clients.push(socket);
  console.log(`Client conectado: ${socket.id}`);

  socket.on("sendLocation", (data) => {
      console.log('Localização recebida');
      // console.log(data);
      const hasLoc = locations.find(location => location.socketId == socket.id);
      if(hasLoc !== undefined){
        locations = locations.map(item => {
          if (item.socketId === socket.id) {
            // Se o socketId for igual, atualize as coordenadas
            item.coordx = data['coordx'];
            item.coordy = data['coordy'];
          }
          return item; // Retorna o item (modificado ou não)
        });
      } else {
        locations.push({socketId: socket.id, name: data['name'] ,coordx: data['coordx'], coordy: data['coordy']});
      }
      // Vendo se vai conectar com alguem
      console.log(locations);

      console.log('Enviando a localização para proximos');
      const otherClient = findClient(socket);
      const sendClientLocation = locations.find(senderLocation => senderLocation.socketId == socket.id);
      const sendClient = clients.find(_client => socket.id == _client.id);
      
      if(otherClient.length > 0){
        console.log('Procurando clients proximos');
        otherClient.forEach(client => {
          receiveClientLocation = locations.find(senderLocation => senderLocation.socketId == client.id);
          if(receiveClientLocation !== undefined) {
            if(calcularDistancia(sendClientLocation.coordx, sendClientLocation.coordy, receiveClientLocation.coordx, receiveClientLocation.coordy)){
              console.log('Client proximo encontrado.');
              // Verifica se a chave já existe no objeto 'visibles'
              if(visibles[receiveClientLocation.name] !== undefined){
                // Se existir, adiciona o nome na lista 'closer'
                visibles[receiveClientLocation.name]['closer'].push(data['name']);
              } else {
                // Se não existir, cria uma nova entrada no objeto
                visibles[receiveClientLocation.name] = {name: receiveClientLocation.name, closer: [data['name']]};
              }
              if(visibles[data['name']] !== undefined){
                visibles[data['name']]['closer'].push(receiveClientLocation.name);
              } else {
                visibles[data['name']] = {name: data['name'], closer: [receiveClientLocation.name]};
              }
              console.log(visibles);

              client.emit("new-user", `${data['name']}`);
              sendClient.emit("new-user",`${receiveClientLocation.name}`);
            } else {
              if (visibles[receiveClientLocation.name] !== undefined) {
                const index = visibles[receiveClientLocation.name]['closer'].indexOf(data['name']);
                if (index !== -1) {
                  visibles[receiveClientLocation.name]['closer'].splice(index, 1); // Remove o nome
                }
              } 
              
              // Remover de 'closer' na entrada de 'data['name']'
              if (visibles[data['name']] !== undefined) {
                const index = visibles[data['name']]['closer'].indexOf(receiveClientLocation.name);
                if (index !== -1) {
                  visibles[data['name']]['closer'].splice(index, 1); // Remove o nome
                }
              }
            }
            console.log(visibles);
          }
        });
      } else {
        console.log('Sem clients proximos.');
      }
    }
  );

  socket.on("message", (data) => {
    console.log('Mensagem recebida');
    const otherClient = findClient(socket);
    const sendClientLocation = locations.find(senderLocation => senderLocation.socketId == socket.id);
    otherClient.forEach(client => {
      const receiveClientLocation = locations.find(senderLocation => senderLocation.socketId == client.id);
      if(receiveClientLocation.name )
      if(calcularDistancia(sendClientLocation.coordx, sendClientLocation.coordy, receiveClientLocation.coordx, receiveClientLocation.coordy)){
        client.emit("message", `${sendClientLocation.name}: ${data}`);
      } else {
        // Guarda a mensagem
        
      }

    });
  });


  socket.on("disconnect", () => {
    const clientIndex = clients.findIndex(
      (_client) => _client.id === socket.id
    );
    clients.splice(clientIndex, 1);
    console.log(`Client desconectado: ${socket.id}`);
    });
  });

server.listen(3000, () => {
  console.log("Server started on port 3000");
});

function findClient(socket) {
  console.log('Procurando client');
  console.log(socket.id);
  return clients.filter((_client) => _client.id !== socket.id);
}

function findClientLocation(socket) {
  console.log('Procurando client');
  console.log(socket.id);
  return locations.filter((_client) => _client.id !== socket.id);
}

function calcularDistancia(x1, y1, x2, y2) {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  
  // Aplicando a fórmula da distância euclidiana
  const distancia = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  console.log(distancia < 200);
  return distancia < 200;
}

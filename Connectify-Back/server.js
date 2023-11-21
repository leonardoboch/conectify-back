const express = require('express');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3001; 
const nameDB = 'connectify.db';

app.use(cors());
app.use(bodyParser.json());

if (!fs.existsSync(nameDB)) {
    console.error(`O banco de dados ${nameDB} não existe. Certifique-se de criá-lo antes de iniciar o servidor.`);
    process.exit(1); 
}

const db = new sqlite3.Database('./connectify.db', (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite');
  }
});

app.get('/api/dados', (req, res) => {
  db.all('SELECT * FROM sua_tabela', (err, rows) => {
    if (err) {
      console.error('Erro ao executar a consulta', err.message);
      res.status(500).send('Erro interno do servidor');
    } else {
      res.json(rows);
    }
  });
});

app.get('/api/artistas', (req,res) => {
    db.all('select * from artista', (err, rows) => {
        if(err) {
            console.log(err.message);
            res.status(500).send('Erro interno do servidor');
        }else {
            res.json(rows);
        }
    })

});

app.get('/api/albums', (req,res) => {
    db.all('select * from album', (err, rows) => {
        if(err) {
            console.log(err.message);
            res.status(500).send('Erro interno do servidor');
        }else {
            res.json(rows);
        }
    })

});

app.get('/api/albums/:id', (req,res) => {
    const albumId = req.params.id;
    const query = 'select * from album where id_album = ' + albumId;
    if(albumId) {
        db.all(query, (err, rows) => {
            if(err) {
                console.log(err.message);
                res.status(500).send('Erro interno do servidor');
            }else {
                res.json(rows);
            }
        });
    }
    

});
app.get('/api/musicas', (req,res) => {
    const idAlbum = req.query.id_album;
    const idArtista = req.query.id_artista;
    const idMusica = req.query.id_musica;
    let query = 'select * from musica';
    query += ' where 1 ';
    if(idAlbum) {
        query += ' AND id_album = ' + idAlbum;
    }
    if(idArtista) {
        query += ' AND id_artista = ' + idArtista;
    }
    if(idMusica) {
        query += ' AND id_musica = ' + idMusica;
    }
    if(query) {
        console.log(query);
        db.all(query, (err, rows) => {
            if(err) {
                console.log(err.message);
                res.status(500).send('Erro interno do servidor');
            }else {
                res.json(rows);
            }
        });
    }
});
app.get('/api/playlist/:id', (req,res) => {
    const idPlaylist = req.params.id;
    let query = 'select * from musicas_playlists mp join musica m on m.id_musica = mp.id_musica join playlist p on p.id_playlist = mp.id_playlist ';
    if(idPlaylist) {
        query += ' where mp.id_playlist =  ' + idPlaylist;
        console.log(query);
        db.all(query, (err, rows) => {
            if(err) {
                console.log(err.message);
            } else {
                res.json(rows);
            }
        });
        
    }

});

app.get('/api/playlist/usuario/:id', (req,res) => {
    const userId = req.params.id;
    console.log(req.query);
    let query = 'select p.id_playlist, p.nome as nome_playlist, u.id_usuario, u.nome_usuario from playlist p join usuario_playlist up on up.id_playlist = p.id_playlist join usuario u on u.id_usuario = up.id_usuario';
    if(userId) {
        query += ' where u.id_usuario =  ' + userId;
        console.log(query);
        db.all(query, (err, rows) => {
            if(err) {
                console.log(err.message);
            } else {
                res.json(rows);
            }
        });
        
    }

});
app.get('/api/usuario/:id', (req,res) => {
    const idUsuario = req.params.id;
    let query = 'select * from usuario ';
    if(idUsuario) {
        query += 'where id_usuario = ' + idUsuario;
        console.log(query);
        db.all(query, (err, rows) => {
            if(err) {
                console.log(err.message);
                res.status(500).send('ERRO INTERNO DO SERVIDOR');
            } else {
                res.json(rows);
            }
        });
    }
    

});
app.get('/api/usuarios', async (req,res) => {
    const query = 'select * from usuario ';
    db.all(query, (err, rows) => {
        if(err) {
            console.log(err.message);
            res.status(500).send('ERRO INTERNO DO SERVIDOR');
        } else {
            res.json(rows);
        }
    });
    try {
        const teste = await getNextId('usuario', 'id_usuario');
        console.log(`o id do usuario é ${teste}`);
        
    } catch (error) {
        console.log(error);
        
    }

});

app.post('/api/insert/usuario', async (req,res) => {
    const {nome, email, senha} = req.body;
    const nextId = await getNextId('usuario', 'id_usuario');
    const query = 'insert into usuario (id_usuario, nome_usuario, email, senha) values (?,?,?,?)';
    db.run(query, [nextId, nome, email, senha], (err) => {
        if(err) {
            console.log(err.message);
            res.status(500).send('Erro interno no servidor');
            return;
        }
        res.send('Usuario Inserido com sucesso');
    } )

});
app.post('/api/insert/playlist', async (req,res) => {
    const {nome, idUsuario} = req.body;
    const nextId = await getNextId('playlist', 'id_playlist');
    const queryPlaylist = 'insert into playlist (id_playlist,nome) values (?,?)';
    db.run(queryPlaylist, [nextId, nome], (err) => {
        if(err) {
            console.log(err.message);
            res.status(500).send('Erro interno no servidor');
            return;
        }
    } );
    const queryUser = 'insert into usuario_playlist (id_usuario, id_playlist) values (?,?)';
    db.run(queryUser, [idUsuario, nextId], (err) => {
        if(err) {
            console.log(err);
            res.send(500).send('Erro Interno do servidor');
            return;
        } 
        res.send('Playlist inserida com sucesso');
    })

});
app.post('/api/delete/playlist', async (req,res) => {
    const {idUsuario, idPlaylist} = req.body;
    const queryUser = 'delete from usuario_playlist where id_usuario = ? and id_playlist = ?';
    db.run(queryUser, [idUsuario, idPlaylist], (err) => {
        if(err) {
            console.log(err);
            res.send(500).send('Erro Interno do servidor');
            return;
        } 
    });
    const queryPlaylist = 'delete from playlist where id_playlist = ?';
    db.run(queryPlaylist, [idPlaylist], (err) => {
        if(err) {
            console.log(err.message);
            res.status(500).send('Erro interno no servidor');
            return;
        }
        res.send('Playlist deletada com sucesso');
    } );


});
app.post('/api/insert/playlist/musica', async (req,res) => {
    const {idMusica, idPlaylist} = req.body;
    const query = 'insert into musicas_playlists (id_musica,id_playlist) values (?,?)';
    db.run(query, [idMusica, idPlaylist], (err) => {
        if(err) {
            console.log(err.message);
            res.status(500).send('Erro interno no servidor');
            return;
        }
        res.send('Inserida na Playlist com sucesso');
    } )

});
app.post('/api/delete/playlist/musica', async (req,res) => {
    const {idMusica, idPlaylist} = req.body;    
    const query = 'delete from musicas_playlists where id_musica =  ? and id_playlist =  ?';
    db.run(query, [idMusica, idPlaylist], (err) => {
        if(err) {
            console.log(err.message);
            res.status(500).send('Erro interno no servidor');
            return;
        }
        res.send('Removida da Playlist com sucesso');
    } )

});

app.post('/api/login', async(req,res) => {
    const {email,senha} = req.body;
    console.log(email);
    console.log(senha);
    console.log(req);
    const query = `select * from usuario where email = '${email}' and senha =  '${senha}'`
    console.log(query);
    db.all(query, (err, rows) => {
        if(err) {
            console.log(err.message);
        } else {
            res.json(rows);
        }
    });

});
//TODO terminar o update, ver o que o usuário pode alterar
app.put('/api/update/usuario', (req,res) => {
    const {id, nome, email, senha} = req.body;
    const query =   'update usuario set senha = ? '


});


app.listen(port, () => {
  console.log(`Servidor está ouvindo na porta ${port}`);
});

function getNextId(table, column) {
    return new Promise((resolve, reject) => {
        const query = `select max(${column}) as next_id from ${table}`;
        db.get(query, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row ? (Number(row.next_id + 1)) : null);
            }
        });
    });
}


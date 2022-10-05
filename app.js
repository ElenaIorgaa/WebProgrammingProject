
var session=require('express-session');
const cookieParser=require('cookie-parser');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const req = require('express/lib/request');

var blocat=false;
var blocat_temporar=false;

const app = express();
app.use(cookieParser());

app.use(session({
	secret: "secret",
	resave:false,
	saveUninitialized:true,
	userid: "necunoscut",
	name: undefined,
	nume:undefined,
	sex:undefined,
	tipUser: undefined,
	vector:[],
	users:[],
	flag:false
	
}))

const port = 6789;

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
//app.get('/', (req, res) => res.send('Hello World'));
var ids=[]
var names=[]
var requestIP=require('request-ip');
app.get('/', (req, res) => {
	
    session=req.session;
	console.log(req.session);
	var f=req.cookies;
	console.log(f);
	//res.render('index',{user:f["utilizator"]});
	if(req.session.flag==false)
	{res.render('index',{user:req.session.name,ids:ids, names:names, tipUser:req.session.tipUser});}
	else{
		var sqlite3=require("sqlite3").verbose();
		var db=new sqlite3.Database("./cumparaturi.bd");
		var selectQuery = 'SELECT * FROM PRODUSE ;';
		names.length=0;
		ids.length=0;

		db.all(selectQuery , (err , data) => {
			if(err) return;

			//Success
			console.log(data);
			
			
			for(var item in data)
		{
			var fla=false;
			var fla2=false;
		
			for (var id in ids)
			{
				if(id==data[item]["ID"])
				{
                   fla=true;
				}
				
			}
			for (var name in names)
			{
				if(name==data[item]["NAME"])
				{
                   fla2=true;
				}
				
			}
			if(fla==false && fla2==false)
			{
				console.log("il adauga");
				ids.push(data[item]["ID"]);
			//console.log("am introdus "+data[item]['ID']);
			//console.log(data[item]['ID']);
				names.push(data[item]["NAME"]);
			}
			//console.log("aiciiiiiiiiiiiiiiiiiiiiiiiii");
			console.log(names);
			console.log("==============================================================");
			console.log(ids);
			
		}
		res.render('index',{user:req.session.name,ids:ids, names:names, tipUser:req.session.tipUser});
		});
		
	}
	});
app.get('/autentificare',(req,res)=>{
	if(blocat==false)
	{var f=req.cookies;
	//res.render('autentificare',{mesaj:f["mesajEroare"]});
	res.render('autentificare',{mesaj:req.session.mesajEroare,tipUser:req.session.tipUser});
	}
	else{
		res.redirect('blocare-resurse');
	}

});

// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get('/chestionar', (req, res) => {
	const fs=require('fs');
	let pars=fs.readFileSync('intrebari.json');
	let listaIntrebari=JSON.parse(pars);
	
	// în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
	res.render('chestionar', {intrebari: listaIntrebari,user: req.session.name,tipUser:req.session.tipUser});
	});


app.post('/verificare-autentificare', (req,res)=>{
	const fs=require('fs');
	let pars=fs.readFileSync('utilizatori.json');
	let lista=JSON.parse(pars);
	
	console.log(req.body);
	var data=req.body;
	let flag=0;
	var ite;
	if(req.session.users){
		req.session.users.push(data["user"]);

	}
	else{
		req.session.users=[data["user"]];
	}

	for (var item=0; item<lista.length; item++)
	{
		if(lista[item]["user"]==data["user"] && lista[item]["pass"]==data["pass"])
			{
				flag=1;
				ite=lista[item];
			}

	}
	req.session.vector=[];
	if(flag==1)
	{
		res.cookie("utilizator",data["user"]);
		//req.session.name=data["user"];
		req.session.nume=ite["nume"];
		req.session.name=ite["prenume"];
		req.session.user=ite["user"];
		req.session.sex=ite["sex"];
		req.session.tipUser=ite["tipUser"];
		req.mesajEroare=undefined;
		

		
		res.redirect('/');
	}
	else {
	
	    res.name=undefined;
		res.cookie("mesajEroare","Eroare la autentificare");
		req.session.mesajEroare="Eroare la autentificare";

        var numar=0;
		console.log(req.session.users);
		for(var i=0; i<req.session.users.length; i++)
		{
			// console.log(req.session.users[i]);
			// console.log(data["user"]);
			if(req.session.users[i]==data["user"])
				numar++;
		}
		if(numar>=5)
		{
			console.log("detectare prea multe logari");
			blocat=true;
			res.redirect('blocare-resurse');

		}
		else res.redirect('/autentificare');
	}
});
app.post('/rezultat-chestionar', (req, res) => {
    console.log(req.body);
	const fs=require('fs');
	let pars=fs.readFileSync('intrebari.json');
	let listaIntrebari=JSON.parse(pars);
	var raspunsuri=0;
	var i=0;
	var data=req.body;
	while(data[i]!=undefined)
	{
		//console.log("Verificam "+data[i]+"cu "+listaIntrebari[i].corect);
		if(data[i]==listaIntrebari[i].corect)
		{
			raspunsuri++;
		}
		i++;
	
	}
	//res.render('rezultat-chestionar');
	//res.send("formular: " + JSON.stringify(req.body));
	res.render('rezultat-chestionar',{intrebari: listaIntrebari,raspunsuri:raspunsuri,user: req.session.name,tipUser:req.session.tipUser});
});
app.post('/logout',(req,res)=>{
	res.clearCookie("utilizator");
	res.clearCookie("mesajEroare");

	req.session.name=undefined;
	req.session.mesajEroare=undefined;
	req.session.vector=undefined;
	req.session.tipUser=undefined;
	req.session.destroy;
	res.redirect('/autentificare');
	});

app.post('/creare-bd',(req,res)=>{
	const db=new sqlite3.Database("cumparaturi.bd",(err) => {
		if (err) {
		  console.error(err.message);
		  throw err;
		} else {
		  console.log("Connected to the SQLite database.");
		  req.session.flag=true;
		}
	  });
	const query='CREATE TABLE PRODUSE (ID NUMBER, NAME VARCHAR(100));';
	db.run(query,(err)=>{
		if(err)
		{
			console.log("eroare creare");
		}else{
			console.log("created");
		}
	});
	res.redirect('/');
	});


	app.post('/inserare-bd',(req,res)=>{
		var sqlite3=require("sqlite3").verbose();
		var db=new sqlite3.Database("./cumparaturi.bd");
		names.length=0
		ids.length=0
		const query='INSERT INTO PRODUSE(ID,NAME) VALUES (1,"Casti"),(2,"Mouse");';
		db.run(query,(err)=>{
			if(err)
			{
				console.log("eroare inserare");
				//res.send("n--a mers");
			}else{
				
				ids.push(1);
				ids.push(2);
				names.push("Casti");
				names.push("Mouse");
			}
		});
		// const query3='INSERT INTO PRODUSE(ID,NAME) VALUES(2,"Mouse");';
		// db.run(query3,(err)=>{
		// 	if(err)
		// 	{
		// 		console.log("eroare inserare");
		// 		//res.send("n--a mers");
		// 	}else{
		// 		console.log("inserare MOUSE");
		// 		//res.send("a mers");
		// 		ids.push(2);
		// 		names.push("Mouse");
		// 	}
		//  });

		// const query2='DELETE FROM PRODUSE;';
		// db.run(query2,(err)=>{
		// 	if(err)
		// 	{
		// 		console.log("eroare stergere");
		// 		//res.send("n--a mers");
		// 	}else{
		// 		console.log("stergere");
		// 		//res.send("a mers");
		// 	}
		// });
		//var selectQuery = 'SELECT * FROM PRODUSE ;';

		// db.all(selectQuery , (err , data) => {
		// 	if(err) return;

		// 	//Success
		// 	console.log(data);
		// 	for(var item in data)
		// {
		// 	ids.push(data[item]["ID"]);
		// 	//console.log("am introdus "+data[item]['ID']);
		// 	//console.log(data[item]['ID']);
		// 	names.push(data[item]["NAME"]);
		// }
		
		// });
		res.redirect('/');
		//res.render('index',{user:req.session.name,ids:ids, names:names, tipUser:req.session.tipUser});

	});


	app.post('/adaugare-cos',(req,res)=>{
		//console.log(req.body['id']);
		if(req.session.vector){
		    req.session.vector.push(req.body['id']);
	
	    }
		else{
			req.session.vector=[req.body['id']];
		}
		res.redirect('/');
		//req.session.vect[0]=req.body['id'];
		//req.session.vector.
		//req.body['id']
	});

	app.get('/vizualizare-cos',(req,res)=>{
		dict={};
		for(var i=0; i<ids.length; i++)
		{
			dict[ids[i]]=names[i];
		}

		console.log(dict);
		console.log(dict['1']);
		console.log(dict[1]);
		console.log("sssssssssssssss");
		console.log(req.session.vector);

		res.render('vizualizare-cos', {produse: req.session.vector, data:dict,tipUser:req.session.tipUser,user: req.session.name});});

	app.get('/admin',(req,res)=>{
		res.render('admin', {tipUser:req.session.tipUser});

	});

	app.get('*',(req,res)=>{
		res.render('blocare-resurse', {tipUser:req.session.tipUser});
	});


	app.post('/adauga-produs',(req,res) =>{
		var sqlite3=require("sqlite3").verbose();
		var db=new sqlite3.Database("./cumparaturi.bd");
		var produs=req.body['produs'];
		var id=req.body['id'];
		//console.log(produs);
		//var values=[[produs,id]].toString;
		const query4='INSERT INTO PRODUSE(ID,NAME) VALUES ('+id+",'"+produs+"');";
		db.run(query4,(err)=>{
			if(err)
			{console.log(err.message);}
		 });
	
		 res.redirect('/');
	});
app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:6789`));
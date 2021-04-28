## Cara import file
node ./dev-data/data/import-json-data.js --delete
before import you should comment 
// userSchema.pre('save', async function(next) in userModel

node ./dev-data/data/import-json-data.js --import


## Tools yang digunakan untuk membuat map
mapbox.com

## Tools untuk melakukan request dari client 
axios

## Tools yang digunakan untuk mendapatkan cookies
cookies-parser it catched our jwt cookies when we are log in

## Parcel-bundler
digunakan untuk merangkum javascript menjadi bundler biar lebih enak dilihat dan rapi

## install @babel/polyfill agar javascript bisa dijalan di browser yg lebih tua
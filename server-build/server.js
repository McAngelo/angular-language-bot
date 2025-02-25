const express = require('express');
const compression = require('compression');
const expressStaticGzip = require('express-static-gzip');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');
const { constants } = require('zlib');
const { pipeline } = require('stream');

const app = express();
const port = process.env.PORT || 3000;

// Enable compression for all responses
app.use(compression({
  level: 6, // Default compression level
  threshold: 0, // Compress all responses
  filter: (req, res) => {
    // Don't compress already compressed files
    if (req.headers['content-type']) {
      return !/^(image|video|audio)/.test(req.headers['content-type']);
    }
    return true;
  }
}));

// Function to compress files with zlib (gzip)
function compressWithGzip(filePath) {
  const gzipFilePath = `${filePath}.gz`;
  const readStream = fs.createReadStream(filePath);
  const writeStream = fs.createWriteStream(gzipFilePath);
  
  pipeline(
    readStream,
    zlib.createGzip({ level: constants.Z_BEST_COMPRESSION }),
    writeStream,
    (err) => {
      if (err) {
        console.error(`Error compressing ${filePath} with gzip:`, err);
      } else {
        console.log(`Successfully compressed ${filePath} with gzip`);
      }
    }
  );
}

// Function to compress files with brotli
function compressWithBrotli(filePath) {
  const brFilePath = `${filePath}.br`;
  const readStream = fs.createReadStream(filePath);
  const writeStream = fs.createWriteStream(brFilePath);
  
  pipeline(
    readStream,
    zlib.createBrotliCompress({
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
      }
    }),
    writeStream,
    (err) => {
      if (err) {
        console.error(`Error compressing ${filePath} with brotli:`, err);
      } else {
        console.log(`Successfully compressed ${filePath} with brotli`);
      }
    }
  );
}

// Function to compress all files in a directory
function compressDirectory(directory) {
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${directory}:`, err);
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting stats for ${filePath}:`, err);
          return;
        }
        
        if (stats.isFile()) {
          // Skip already compressed files
          if (!filePath.endsWith('.gz') && !filePath.endsWith('.br')) {
            compressWithGzip(filePath);
            compressWithBrotli(filePath);
          }
        } else if (stats.isDirectory()) {
          compressDirectory(filePath); // Recursively compress subdirectories
        }
      });
    });
  });
}

// Compress files in the public directory when server starts
const staticDir = path.join(__dirname, 'browser');
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}
compressDirectory(staticDir);

// Serve static files with pre-compressed versions
app.use('/', expressStaticGzip(staticDir, {
  enableBrotli: true,
  orderPreference: ['br', 'gz'],
  serveStatic: {
    maxAge: '1d',
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }
}));

// Add an endpoint to trigger compression on demand
app.get('/compress', (req, res) => {
  compressDirectory(staticDir);
  res.send('Compression initiated for all files in the public directory');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Serving static files from ${staticDir}`);
});
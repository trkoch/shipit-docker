function buildCmd(options) {
  let {path, file = 'Dockerfile', image} = options
  if (!path) { throw new Error('Missing path') }
  return `cd ${path}; docker build -f ${file} -t ${image} .`
}

function runCmd(options) {
  let {
    container, image,
    net = false,
    detach = !!net,
    localPort = 80,
    containerPort = 80,
    volumes = []
  } = options

  return [
    `docker run --name=${container}`,
    volumes.map(v => `-v ${v}`).join(' '),
    net ? `--net=${net}` : '',
    net ? `--publish=${localPort}:${containerPort}` : '',
    net ? `--restart=always` : '',
    detach ? `--detach` : '',
    `${image}`
  ].filter(o => o).join(' ')
}

module.exports = {
  buildCmd,
  runCmd
}

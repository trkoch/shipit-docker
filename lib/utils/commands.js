function buildCmd (options) {
  let {path, file = 'Dockerfile', image} = options
  if (!path) { throw new Error('Missing path') }
  return `cd ${path}; docker build -f ${file} -t ${image} .`
}

function buildCmdLocal (options) {
  let {workspace, file = 'Dockerfile', image} = options
  if (!workspace) { throw new Error('Missing workspace') }
  return `cd ${workspace}; docker build -f ${file} -t ${image} .`
}

function tagCmdLocal (options) {
  let {image, registryUrl} = options
  let tag = 'latest'
  return `docker tag ${image}:${tag} ${registryUrl}:${tag}`
}

function pushCmdLocal (options) {
  let {registryUrl} = options
  let tag = 'latest'
  return `docker push ${registryUrl}:${tag}`
}

function pullCmd (options) {
  let {registryUrl} = options
  return `docker pull ${registryUrl}`
}

function runCmd (options) {
  let {
    container,
    image,
    net = false,
    detach = !!net,
    localPort = 80,
    containerPort = 80,
    volumes = [],
    envs = []
  } = options

  if (options.registryUrl) {
    image = options.registryUrl
  }

  return [
    `docker run --name=${container}`,
    volumes.map(v => `-v ${v}`).join(' '),
    envs.map(e => `-e ${e}`).join(' '),
    net ? `--net=${net}` : '',
    net ? `--publish=${localPort}:${containerPort}` : '',
    net ? `--restart=always` : '',
    detach ? `--detach` : '',
    `${image}`
  ].filter(o => o).join(' ')
}

module.exports = {
  buildCmd,
  buildCmdLocal,
  tagCmdLocal,
  pushCmdLocal,
  pullCmd,
  runCmd
}

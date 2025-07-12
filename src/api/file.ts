import shttp from '@/utils/shttp'

const file = {
  getFiles({ param = '/' }) {
    return shttp.get(`/gw/download/file${param}`)
  },
  createFile(filepath: string, fields: any) {
    const form = new FormData()
    for (let k in fields) {
      if (fields[k] instanceof Array) {
        fields[k].forEach((v: any) => {
          form.append(k, v)
        })
      } else {
        form.append(k, fields[k])
      }
    }
    // @ts-ignore
    return shttp.post(`/gw/download/file${filepath}`, form).header({ 'Content-Type': 'multipart/form-data;charset=UTF-8' })
  },
  destroyFile({ param = '/', isDir = '0' }) {
    return shttp.delete(`/gw/download/file${param}?isDir=${isDir}`)
  },
  renameFile({ dirpath, oldname, newname }: { dirpath: string; oldname: string; newname: string }) {
    return shttp.put(`/gw/download/file${dirpath}`, {
      oldname,
      newname,
    })
  },
  loadingInfo: async (filepath: string) => {
    return shttp.post('/gw/download/ffmpeg/video-info-full', { filepath })
  },
  excuteTemplate: async (id: string, data: any) => {
    return shttp.post('/gw/download/ffmpeg/' + id, data)
  }
}

export default file;
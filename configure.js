async function setSemester(store, semester) {
  store.setItem("semester",semester)
}

async function setProgram(store, program) {
  store.setItem("program",program)
}

module.exports = {setSemester: setSemester, setProgram: setProgram}

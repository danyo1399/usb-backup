import { html, useEffect } from '../globals.js'
import { useDialog } from './Dialog/index.js'

const licenseShownKey = 'usb-backup__licenseShown'

export default function LicenseDialog () {
  const { showDialog } = useDialog()

  useEffect(() => {
    const licenseShown = window.localStorage.getItem(licenseShownKey)
    if (!licenseShown) {
      showDialog(LicenceDialogContent, { title: 'MIT License', size: 'modal-lg' })
    }
  }, [])
  return null
}

function LicenceDialogContent ({ closeDialog }) {
  function onAgree () {
    window.localStorage.setItem(licenseShownKey, '1')
    closeDialog()
  }

  return html`
    <div class="modal-body">
        <p >
MIT License
</p>
<p>
Copyright (c) 2022 danyo1399
</p>
<p>
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
</p>
<p>
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
</p>
<p>
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
</p>
    </div>
    <div class="modal-footer">
        <button type="button" class="btn btn-primary" onClick=${onAgree}>I Agree</button>
    </div>
`
}

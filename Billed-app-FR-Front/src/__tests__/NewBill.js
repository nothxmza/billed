/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import e from "express"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store";
import { fireEvent } from "@testing-library/dom";
import router from "../app/Router.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js"

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      const activeIcon = mailIcon.classList.contains('active-icon')
      expect(activeIcon).toBeTruthy()
    })
    test("Then, the handleSubmit is called", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const onNavigate = jest.fn()
      const store = null

      const newBill = new NewBill({document, onNavigate, store, localStorage: window.localStorage})

      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn(newBill.handleSubmit)
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)
      expect(handleSubmit).toHaveBeenCalled()
    })
  })
})

describe("When I am on NewBill Page", () => {
  beforeEach(() => {
    document.body.innerHTML = NewBillUI()
    window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
    window.alert = jest.fn()
  })

  test("Then, the handleChangeFile is called", () => {
    const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
    const store = mockStore
    const newBill = new NewBill({document, onNavigate, store, localStorage: window.localStorage})

    const file = screen.getByTestId('file')
    const handleChangeFile = jest.fn(newBill.handleChangeFile)
    file.addEventListener('change', handleChangeFile)
    fireEvent.change(file)
    expect(handleChangeFile).toHaveBeenCalled()
  })

  test("Then, the valid file upload should work", () => {
    const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
    const store = mockStore
    const newBill = new NewBill({
      document,
      onNavigate,
      store,
      localStorage: window.localStorage
    })

    const file = screen.getByTestId('file')
    const handleChangeFile = jest.fn(newBill.handleChangeFile)
    file.addEventListener('change', handleChangeFile)

    const testFile = new File(['test'], 'test.png', { type: 'image/png' })
    Object.defineProperty(file, 'files', {value: [testFile]})
    Object.defineProperty(file, 'value', {value: 'fakepath-test.png'})
    
    fireEvent.change(file)

    expect(handleChangeFile).toHaveBeenCalled()
    expect(file.files[0].name).toBe('test.png')
    expect(file.value).toBe('fakepath-test.png')
    expect(file.files[0].type).toBe('image/png')
    expect(window.alert).not.toHaveBeenCalled()
  })

  test("Then, the invalid file upload should not work", () => {
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    const store = mockStore
    const newBill = new NewBill({
      document,
      onNavigate,
      store,
      localStorage: window.localStorage
    })

    const file = screen.getByTestId('file')
    const handleChangeFile = jest.fn(newBill.handleChangeFile)
    file.addEventListener('change', handleChangeFile)

    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    Object.defineProperty(file, 'files', {value: [testFile]})
    Object.defineProperty(file, 'value', {value: 'fakepath-test.txt'})
    
    fireEvent.change(file)

    expect(handleChangeFile).toHaveBeenCalled()
    expect(file.files[0].name).toBe('test.txt')
    expect(file.value).toBe('fakepath-test.txt')
    expect(file.files[0].type).toBe('text/plain')
    expect(window.alert).toHaveBeenCalledWith('Le format du fichier n\'est pas valide. Les formats acceptés sont jpg, jpeg et png.')
  })
})

//POST
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to NewBill", () => {
    test("Then it should create a new bill from mock API POST", async () => {
      const postSpy = jest.spyOn(mockStore, "bills")
      const bill = {
        "id": "47qAXb6fIm2zOKkLzMro",
        "vat": "80",
        "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        "status": "pending",
        "type": "Hôtel et logement",
        "commentary": "séminaire billed",
        "name": "encore",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "commentAdmin": "ok",
        "email": "a@a",
        "pct": 20
      }

      const postBill = await mockStore.bills().create(bill)
      expect(postSpy).toHaveBeenCalledTimes(1)
      expect(postBill).toBeTruthy()
    })
  })
})

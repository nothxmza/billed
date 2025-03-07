/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent, getByTestId} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";
import e from "express";
import { formatDate } from "../app/format.js";
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon).toBeTruthy()

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    test("Then the New Bill button should be present and clickable", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = jest.fn()
      const store = null
      const billsContainer = new Bills({ document, onNavigate, store, localStorage: window.localStorage })
      const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill) //mock the handleClickNewBill function
      const buttonNewBill = screen.getByTestId('btn-new-bill')
      buttonNewBill.addEventListener('click', handleClickNewBill)
      fireEvent.click(buttonNewBill)
      expect(handleClickNewBill).toHaveBeenCalled() //check if the function was called
    })

    test("Then the modal should open when the eye icon is clicked", async () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = jest.fn()
      const store = null
      const billsContainer = new Bills({ document, onNavigate, store, localStorage: window.localStorage })
      $.fn.modal = jest.fn() //mock the modal function
      const iconEye = screen.getAllByTestId('icon-eye')[0]
      const handleClickIconEye = jest.fn(() => billsContainer.handleClickIconEye(iconEye))
      iconEye.addEventListener('click', handleClickIconEye)
      fireEvent.click(iconEye)
      expect(handleClickIconEye).toHaveBeenCalled()
      expect($.fn.modal).toHaveBeenCalledWith('show') //check if the modal function was called with the right argument
    })
    
    test("Then the getBills method should return formatted bills", async () => {
      const onNavigate = jest.fn()
      const store = mockStore
      const localStorage = window.localStorage
      const billsContainer = new Bills({ document, onNavigate, store, localStorage })
      const result = await billsContainer.getBills()
      expect(result.length).toBe(4)
      expect(result[0].date).toBe(formatDate("2004-04-04"))
      expect(result[0].status).toBe("En attente")
    })
  })
})


// Test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const contentPending = await screen.getByText("pending")
      expect(contentPending).toBeTruthy()
      const contentAccepted = await screen.getByText("Accepté")
      expect(contentAccepted).toBeTruthy()
      expect(screen.getAllByTestId("btn-new-bill")).toBeTruthy()
    })
	describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches bills from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
})
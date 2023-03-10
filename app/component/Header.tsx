import { Form, Link, NavLink, useFetcher, useLocation } from "@remix-run/react";
import { Navbar, Dropdown, Avatar, Button } from "flowbite-react";
import LopenlingLogo from "~/assets/svg/logo.svg";
import { useLitteraMethods } from "@assembless/react-littera";
import { MAX_WIDTH_PAGE } from "~/constants";
import { uselitteraTranlation } from "~/locales/translations";
export default function Header({ user }: any) {
  const location = useLocation();
  const loginFetcher = useFetcher();
  const translation = uselitteraTranlation();

  return (
    <div className=" max-w-full shadow-header px-2">
      <Navbar
        fluid={false}
        className="mx-auto my-0 flex items-center"
        style={{
          minHeight: 56,
          padding: 0,
          maxWidth: MAX_WIDTH_PAGE,
        }}
      >
        <Navbar.Brand to={"/"} as={NavLink} className="flex items-center">
          <img
            src="https://lopenling.org/uploads/default/original/1X/0ac3db8e589f085c53c5ff8f36c17722888658ad.png"
            alt="logo"
            className="hidden md:block object-contain"
            style={{ maxHeight: 37 }}
          />
          <img
            src={LopenlingLogo}
            alt="logo"
            className="block md:hidden object-contain"
            style={{ maxHeight: 37 }}
          />
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <div
            className={`flex ${
              user ? "justify-between" : "flex-col"
            } md:flex-row`}
          >
            <div className="flex items-center">
              <Translation />
            </div>

            {user ? (
              <div className="flex md:order-2">
                <Dropdown
                  className="z-10"
                  inline={true}
                  arrowIcon={null}
                  label={
                    <Avatar
                      alt={user.name}
                      img={user.avatarUrl}
                      rounded={true}
                      size="sm"
                      title={user?.name}
                    />
                  }
                >
                  <Dropdown.Header>
                    <span className="block truncate text-sm font-medium">
                      {user?.email}
                    </span>
                  </Dropdown.Header>
                  <Dropdown.Item
                    className={user?.admin === "true" ? "" : "hidden"}
                  >
                    <NavLink preventScrollReset to="/text-upload">
                      UploadText
                    </NavLink>
                  </Dropdown.Item>

                  <Dropdown.Item>
                    <Form
                      method="post"
                      action="/sso/login"
                      className="flex items-center"
                    >
                      <input
                        type="hidden"
                        name="redirectTo"
                        className="block rounded py-2 pl-3 pr-4 text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:p-0 md:hover:bg-transparent md:hover:text-blue-700 md:dark:hover:bg-transparent md:dark:hover:text-white"
                        defaultValue={location.pathname}
                      />
                      <button
                        className="text-sm font-medium leading-tight text-gray-900"
                        type="submit"
                        name="_action"
                        value="logout"
                      >
                        {translation.logout}
                      </button>
                    </Form>
                  </Dropdown.Item>
                </Dropdown>
              </div>
            ) : (
              <div className="flex gap-2 justify-between p-3">
                <loginFetcher.Form
                  method="post"
                  action="/sso/login"
                  className="flex items-center"
                >
                  <input
                    type="hidden"
                    name="redirectTo"
                    defaultValue={location.pathname}
                  />

                  <button
                    type="submit"
                    name="_action"
                    value="login"
                    className="text-sm font-medium leading-tight text-gray-900 capitalize"
                  >
                    {translation.login}
                  </button>
                </loginFetcher.Form>
                <Button
                  // gradientDuoTone="tealToLime"
                  className=" text-green-400 border-2 border-green-300"
                  color=""
                >
                  <a href={"https://lopenling.org/signup"}>
                    {translation.signup}
                  </a>
                </Button>
              </div>
            )}
          </div>
        </Navbar.Collapse>
      </Navbar>
    </div>
  );
}

function Translation() {
  const methods = useLitteraMethods();
  function changeLanguage(e) {
    switch (e.target.value) {
      case "en":
        methods.setLocale("en_US");
        break;
      case "bo":
        methods.setLocale("bo_TI");

        break;
    }
  }
  return (
    <div className="md:mr-10 flex items-center justify-start space-x-0.5">
      <select
        onChange={changeLanguage}
        className="border-transparent focus:border-transparent focus:ring-0"
      >
        <option value="en">English</option>
        <option value="bo">????????????????????????</option>
      </select>
    </div>
  );
}

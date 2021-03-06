import React, {
  useState,
  useEffect,
  useReducer,
  useCallback,
  lazy,
  Suspense
} from 'react'
import { useQuery, useMutation } from '@apollo/client'
import PropTypes from 'prop-types'
import Box from '@material-ui/core/Box'
import Typography from '@material-ui/core/Typography'
import ArrowBackIcon from '@material-ui/icons/ArrowBack'
import IconButton from '@material-ui/core/IconButton'
import Alert from '@material-ui/lab/Alert'
import CloseIcon from '@material-ui/icons/Close'
import ContactMailIcon from '@material-ui/icons/ContactMail'
import { makeStyles } from '@material-ui/styles'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { useTheme } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import Backdrop from '@material-ui/core/Backdrop'
import Snackbar from '@material-ui/core/Snackbar'
import CircularProgress from '@material-ui/core/CircularProgress'

import {
  CREATE_ACCOUNT_MUTATION,
  CREATE_PRE_REGISTER_ORGANIZATION_MUTATION,
  VALIDATION_EMAIL
} from '../../gql'

import SignupRoleSelector from './SignupRoleSelector'
import ValidateEmail from './ValidateEmail'
import { useSharedState } from '../../context/state.context'

const SignupUser = lazy(() => import('./SignupUser'))
const SignupOrganization = lazy(() => import('./SignupOrganization'))

const useStyles = makeStyles(theme => ({
  closeIcon: {
    position: 'absolute',
    zIndex: 1,
    top: 14,
    right: 14,
    margin: '0',
    height: '5vh',
    '& svg': {
      fontSize: 25,
      color: 'rgba(0, 0, 0, 0.6)'
    }
  },
  dialog: {
    paddingTop: '53px',
    paddingLeft: '53px',
    paddingRight: '53px',
    paddingBottom: '38px',
    [theme.breakpoints.down('md')]: {
      paddingLeft: '21px',
      paddingRight: '21px'
    }
  },
  register: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%'
  },
  gridContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'center',
    padding: '5% 0'
  },
  goBack: {
    position: 'absolute',
    zIndex: 1,
    top: 14,
    left: 14,
    margin: '0',
    height: '5vh',
    '& svg': {
      fontSize: 25,
      color: 'rgba(0, 0, 0, 0.6)'
    }
  },
  registerBack: {
    color: `${theme.palette.primary.main} !important`
  },
  stepperContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing(2)
  },
  titleRegister: {
    fontSize: '34px',
    fontWeight: 'normal',
    fontStretch: 'normal',
    fontStyle: 'normal',
    lineHeight: 1.18,
    letterSpacing: '0.25px',
    color: '#rgba(0, 0, 0, 0.87)',
    marginBottom: 15
  },
  text: {
    fontSize: '12px',
    fontWeight: 'normal',
    fontStretch: 'normal',
    fontStyle: 'normal',
    lineHeight: 1.33,
    letterSpacing: '0.4px',
    color: '#000000',
    marginBottom: 30
  },
  form: {
    width: '100%',
    padding: theme.spacing(0, 2),
    marginTop: theme.spacing(3)
  },
  textFieldWrapper: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    alignItems: 'center'
  },
  textField: {
    marginTop: theme.spacing(2),
    width: '100%'
  },
  btnWrapper: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    alignItems: 'center',
    margin: theme.spacing(2, 0)
  },
  alert: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    width: '100%'
  },
  registerBtn: {
    width: 180,
    height: 49,
    color: '#000000',
    backgroundColor: 'transparent',
    margin: theme.spacing(2, 0, 4, 0),
    borderRadius: ' 2px',
    border: 'solid 2px #000000'
  },
  registerBoxModal: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center'
  },
  registerTextModal: {
    fontSize: '12px',
    fontWeight: 'normal',
    fontStretch: 'normal',
    fontStyle: 'normal',
    lineHeight: 1.33,
    letterSpacing: '0.4px',
    color: '#000000'
  },
  labelOption: {
    color: `${theme.palette.primary.main} !important`,
    marginLeft: theme.spacing(3),
    fontSize: 14,
    textTransform: 'capitalize'
  },
  iconOption: {
    color: 'rgba(0, 0, 0, 0.54)',
    fontSize: 20
  },
  registerBtnSideBar: {
    display: 'flex',
    alignItems: 'center'
  }
}))

const Signup = ({ isHome, isModal, isSideBar }) => {
  const { t } = useTranslation('signup')
  const classes = useStyles()
  const [user, setUser] = useReducer(
    (user, newUser) => ({ ...user, ...newUser }),
    {}
  )
  const [activeStep, setActiveStep] = useState(0)
  const [role, setRole] = useState()
  const [{ showSignupModal: open }, { login, cancelSignup }] = useSharedState()
  const [openAlert, setOpenAlert] = useState(false)
  const [messegaAlert, setMessegaAlert] = useState('false')
  const [maxWidth] = useState('sm')
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const [errorMessage, setErrorMessage] = useState(null)
  const [isEmailValid, setEmailValid] = useState(false)
  const [checkEmailLoading, setcheckEmailLoaded] = useState(false)
  const [state] = useSharedState()

  const handleOpen = () => {
    cancelSignup()
  }

  const handleOpenAlert = () => {
    setOpenAlert(!openAlert)
  }

  const [
    createAccount,
    {
      error: errorcreateAccount,
      loading: createAccountLoading,
      data: { create_account: createAccountResult } = {}
    }
  ] = useMutation(CREATE_ACCOUNT_MUTATION)

  const [
    preRegisterOrganization,
    {
      error: errorpreRegisterOrganization,
      loading: preRegisterOrganizationLoading,
      data: {
        create_pre_register_organization: preRegisterOrganizationResult
      } = {}
    }
  ] = useMutation(CREATE_PRE_REGISTER_ORGANIZATION_MUTATION)

  const handleRoleChange = role => {
    setRole(role)
    setActiveStep(activeStep + 1)
  }

  const handleSetField = useCallback((field, value) => {
    setUser({ [field]: value })
  }, [])

  const handleGoBack = () => {
    activeStep && setActiveStep(activeStep - 1)
    handleSetField('email', ' ')
  }

  const handleCreateAccount = () => {
    const { email, secret } = user
    const name = 'My profile'
    createAccount({
      variables: {
        role,
        email,
        emailContent: {
          subject: t('emailMessage.subjectVerificationCode'),
          title: t('emailMessage.titleVerificationCode'),
          message: t('emailMessage.messageVerificationCode'),
          button: t('emailMessage.verifyButton')
        },
        name,
        passwordPlainText: secret
      }
    })
  }

  const handleCreateAccountWithAuth = async (status, email, name, secret) => {
    if (status) {
      const { data } = await checkEmail({ email: email })

      if (data.user.length === 0) {
        createAccount({
          variables: {
            role,
            email,
            emailContent: {
              subject: t('emailMessage.subjectVerificationCode'),
              title: t('emailMessage.titleVerificationCode'),
              message: t('emailMessage.messageVerificationCode'),
              button: t('emailMessage.verifyButton')
            },
            name,
            passwordPlainText: secret
          }
        })
      } else setErrorMessage(t('errors.authError'))
    } else setErrorMessage(t('somethingHappenedWithAuth'))
  }

  const handlepreRegisterOrganization = () => {
    const { email, password, name, address, phone, description } = user
    let { invitationCode } = user
    if (invitationCode === undefined || !invitationCode) invitationCode = ' '

    preRegisterOrganization({
      variables: {
        email,
        emailContent: {
          subject: t('emailMessage.subjectVerificationCode'),
          title: t('emailMessage.titleVerificationCode'),
          message: t('emailMessage.messageVerificationCode'),
          button: t('emailMessage.verifyButton')
        },
        passwordPlainText: password,
        name,
        address,
        phone,
        description,
        invitation_code: invitationCode
      }
    })
  }

  const { refetch: checkEmail } = useQuery(VALIDATION_EMAIL, {
    variables: {
      email: user.email
    },
    skip: true
  })

  useEffect(() => {
    const regularExpresion = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/
    const validEmail = async () => {
      const { data } = await checkEmail({
        email: user.email
      })

      if (data) {
        data.preregister_organization.length === 0 && data.user.length === 0
          ? setEmailValid(true)
          : setEmailValid(false)

        setcheckEmailLoaded(true)
      }
    }

    if (regularExpresion.test(user?.email)) {
      validEmail()
    } else {
      setEmailValid(false)
      setcheckEmailLoaded(false)
    }
  }, [user?.email, checkEmail])

  useEffect(() => {
    if (preRegisterOrganizationResult) {
      handleOpen()
      setMessegaAlert(t('sucessfulPreregistration'))
      handleOpenAlert()
    }
  }, [preRegisterOrganizationResult])

  useEffect(() => {
    if (createAccountResult) {
      handleOpen()
      setMessegaAlert(t('sucessfulRegistration'))
      handleOpenAlert()
    }
  }, [createAccountResult])

  useEffect(() => {
    if (errorcreateAccount) setErrorMessage(t('errors.authError'))
  }, [errorcreateAccount])

  useEffect(() => {
    if (errorpreRegisterOrganization) setErrorMessage(t('errors.authError'))
  }, [errorpreRegisterOrganization])

  const ErrorMessage = () => {
    return (
      <>
        {errorMessage && (
          <Alert
            className={classes.alert}
            severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setErrorMessage(null)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {errorMessage}
          </Alert>
        )}
      </>
    )
  }

  return (
    <>
      {isHome && state.user === null && (
        <Button
          color="secondary"
          className={classes.registerBtn}
          onClick={handleOpen}
        >
          {t('register')}
        </Button>
      )}
      {isSideBar && state.user !== null && (
        <Box className={classes.registerBtnSideBar} onClick={handleOpen}>
          <ContactMailIcon className={classes.iconOption} />
          <Link to="/">
            <Typography variant="body1" className={classes.labelOption}>
              {t('register')}
            </Typography>
          </Link>
        </Box>
      )}
      <Dialog
        fullScreen={fullScreen}
        maxWidth={maxWidth}
        fullWidth
        open={open}
        onClose={handleOpen}
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500
        }}
      >
        <Box className={classes.dialog}>
          <Box className={classes.closeIcon}>
            <IconButton
              aria-label="close"
              color="inherit"
              onClick={() => {
                handleOpen()
                login()
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Box>
          {activeStep !== 0 && (
            <Box className={classes.goBack}>
              <IconButton aria-label="go-back" onClick={handleGoBack}>
                <ArrowBackIcon color="primary" />
              </IconButton>
            </Box>
          )}
          <Box className={classes.register}>
            <Box className={classes.stepperContent}>
              {activeStep === 0 && (
                <>
                  <Typography className={classes.titleRegister}>
                    {t('register')}
                  </Typography>
                  <Typography className={classes.text}>
                    {t('registerText')}
                  </Typography>
                  <SignupRoleSelector onSubmit={handleRoleChange} />
                </>
              )}
              {activeStep === 1 && role === 'user' && (
                <>
                  <Typography className={classes.titleRegister}>
                    {t('asAUser')}
                  </Typography>
                  <Typography className={classes.text}>
                    {t('allYouNeed')}
                  </Typography>
                  <Suspense fallback={<CircularProgress />}>
                    <SignupUser
                      onSubmit={handleCreateAccount}
                      onSubmitWithAuth={handleCreateAccountWithAuth}
                      loading={createAccountLoading}
                      setField={handleSetField}
                      isEmailValid={isEmailValid}
                    >
                      <ErrorMessage />
                      <ValidateEmail
                        isValid={isEmailValid}
                        loading={checkEmailLoading}
                        setField={handleSetField}
                        user={user}
                      />
                    </SignupUser>
                  </Suspense>
                </>
              )}
              {activeStep === 1 && role === 'organization' && (
                <>
                  <Typography className={classes.titleRegister}>
                    {t('asAOrganization')}
                  </Typography>
                  <Typography variant="body1" className={classes.text}>
                    {t('preRegistrationRequirement')}
                  </Typography>
                  <Suspense fallback={<CircularProgress />}>
                    <SignupOrganization
                      onSubmit={handlepreRegisterOrganization}
                      loading={preRegisterOrganizationLoading}
                      setField={handleSetField}
                      user={user}
                      isEmailValid={isEmailValid}
                    >
                      <ValidateEmail
                        isValid={isEmailValid}
                        loading={checkEmailLoading}
                        user={user}
                        setField={handleSetField}
                      />
                    </SignupOrganization>
                  </Suspense>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Dialog>
      <Snackbar
        open={openAlert}
        autoHideDuration={6000}
        onClose={handleOpenAlert}
      >
        <Alert onClose={handleOpenAlert} severity="success">
          {messegaAlert}
        </Alert>
      </Snackbar>
    </>
  )
}

Signup.propTypes = {
  isHome: PropTypes.bool,
  isModal: PropTypes.bool,
  isSideBar: PropTypes.bool
}

Signup.defaultProps = {
  isHome: false,
  isModal: false,
  isSideBar: false
}

export default Signup

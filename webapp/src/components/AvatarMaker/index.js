import React, { memo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import Box from '@material-ui/core/Box'
import { fabric } from 'fabric'
import { makeStyles } from '@material-ui/styles'
import Grid from '@material-ui/core/Grid'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'

import FabricCanvas from './FabricCanvas'
import TemplateList from './TemplateList'
import {
  decolist,
  bglist,
  mouthlist,
  baselist,
  eyeslist
} from '../../images/templates/templatelist'

import styles from './styles'

const useStyles = makeStyles(styles)

const a11yProps = index => {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`
  }
}

const TabPanel = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`full-width-tabpanel-${index}`}
    aria-labelledby={`full-width-tab-${index}`}
  >
    {value === index && <Box p={3}>{children}</Box>}
  </div>
)

TabPanel.propTypes = {
  children: PropTypes.object,
  value: PropTypes.any,
  index: PropTypes.number
}

const AvatarMaker = ({ onGetDataUrl }) => {
  const classes = useStyles()
  const [activeProperty, setActiveProperty] = useState(null)
  const [value, setValue] = useState()

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const addToCanvas = (imgElement, propertyType, zIndex) => {
    const imgInstance = new fabric.Image(imgElement, {
      width: 400,
      height: 400,
      the_type: propertyType,
      zIndex
    })

    setActiveProperty(imgInstance)
  }

  useEffect(() => {
    setValue(0)
  }, [])

  return (
    <Box className={classes.mainBox}>
      <Grid>
        <FabricCanvas
          activeProperty={activeProperty}
          onGetDataUrl={onGetDataUrl}
        />
      </Grid>
      <Grid>
        <Tabs
          value={value || 0}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          aria-label="full width tabs example"
        >
          <Tab
            label="Base"
            classes={{
              fullWidth: classes.borderTabs,
              selected: classes.tabSelected
            }}
            {...a11yProps(0)}
          />
          <Tab
            label="Eyes"
            classes={{
              fullWidth: classes.borderTabs,
              selected: classes.tabSelected
            }}
            {...a11yProps(1)}
          />
          <Tab
            label="Mouth"
            classes={{
              fullWidth: classes.borderTabs,
              selected: classes.tabSelected
            }}
            {...a11yProps(2)}
          />
          <Tab
            label="Deco"
            classes={{
              fullWidth: classes.borderTabs,
              selected: classes.tabSelected
            }}
            {...a11yProps(3)}
          />
          <Tab
            label="Background"
            classes={{
              fullWidth: classes.borderTabs,
              selected: classes.tabSelected
            }}
            {...a11yProps(4)}
          />
        </Tabs>

        <TabPanel value={value} index={0}>
          <TemplateList
            data={baselist}
            propertyType="base"
            zIndex={0}
            addToCanvas={addToCanvas}
          />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <TemplateList
            data={eyeslist}
            propertyType="eyes"
            zIndex={2}
            addToCanvas={addToCanvas}
          />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <TemplateList
            data={mouthlist}
            propertyType="mouth"
            zIndex={2}
            addToCanvas={addToCanvas}
          />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <TemplateList
            data={decolist}
            propertyType="deco"
            zIndex={2}
            addToCanvas={addToCanvas}
          />
        </TabPanel>
        <TabPanel value={value} index={4}>
          <TemplateList
            data={bglist}
            propertyType="bg"
            zIndex={2}
            addToCanvas={addToCanvas}
          />
        </TabPanel>
      </Grid>
    </Box>
  )
}

AvatarMaker.propTypes = {
  onGetDataUrl: PropTypes.func
}

AvatarMaker.defaultProp = {
  onGetDataUrl: () => {}
}

export default memo(AvatarMaker)